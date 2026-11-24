/**
 * Kayıtlı verilerin denetimi.
 *
 *  - onEdit           : E-tabloya ELLE girilen bir satır başka bir satırla aynıysa
 *                       uyarı gösterir ve anahtar hücreye "⚠ Mükerrer" notu düşer.
 *  - mukerrerDenetle  : Tüm sayfalarda mükerrer kayıtları, künye ile çıktı sayıları
 *                       arasındaki tutarsızlıkları ve kişi bazında doluluk durumunu raporlar.
 *  - denetimPenceresi : Raporu E-Tablo menüsünden pencere olarak açar.
 */

var MUKERRER_NOT = '⚠ Mükerrer';

/** Basit tetikleyici: elle düzenlemede mükerrer uyarısı. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    SpreadsheetApp.flush();
    var sh = e.range.getSheet(), ss = sh.getParent();
    var r1 = e.range.getRow(), r2 = e.range.getLastRow(), c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
    SEMA.filter(function (s) { return s.sayfa === sh.getName(); }).forEach(function (s) {
      var kols = anahtarSutunlari_(s);
      if (!kols.length || !kols.some(function (c) { var n = sutunNo_(c); return n >= c1 && n <= c2; })) return;
      var ar = tabloAraligi_(ss, sh, s), ilk = ar.getRow(), son = ilk + ar.getNumRows() - 1;
      for (var satir = Math.max(r1, ilk); satir <= Math.min(r2, son); satir++) {
        var bulunan = satirMukerrerMi_(sh, s, ilk, son, satir);
        if (bulunan && bulunan.benzer) bulunan = null;
        var hucre = sh.getRange(satir, sutunNo_(kols[0]));
        var not = hucre.getNote();
        if (bulunan) {
          hucre.setNote(MUKERRER_NOT + ': ' + bulunan.satir + '. satırla aynı kayıt. Lütfen bu satırı silin.');
          ss.toast('Bu kayıt ' + bulunan.satir + '. satırda zaten var (' + s.baslik + '). Mükerrer satırı silin.', '⚠ Mükerrer kayıt', 10);
        } else if (not.indexOf(MUKERRER_NOT) === 0) {
          hucre.clearNote();
        }
      }
    });
  } catch (err) {
    // Denetim, düzenlemeyi asla engellemez.
  }
}

function satirMukerrerMi_(sh, s, ilk, son, satir) {
  var kols = anahtarSutunlari_(s);
  var genislik = sutunNo_(s.tarihSutun);
  var r = sh.getRange(satir, 1, 1, genislik).getDisplayValues()[0];
  var veri = {};
  kols.forEach(function (c) { veri[c] = r[sutunNo_(c) - 1]; });
  return tekrarBul_(sh, s, ilk, son, veri, satir);
}

/**
 * Tüm denetim. isaretle=true ise mükerrer satırların anahtar hücresine not düşer
 * (eski mükerrer notları önce silinir).
 */
function mukerrerDenetle(isaretle) {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var rapor = { mukerrer: [], tutarsizlik: [], kisiler: [], tarih: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm') };

  SEMA.forEach(function (s) {
    var kols = anahtarSutunlari_(s);
    var sh = ss.getSheetByName(s.sayfa);
    if (!kols.length || !sh) return;
    var ar = tabloAraligi_(ss, sh, s), ilk = ar.getRow(), n = ar.getNumRows();
    var v = sh.getRange(ilk, 1, n, sutunNo_(s.tarihSutun)).getDisplayValues();
    var anaNo = sutunNo_(kols[0]);
    if (isaretle) {
      var notlar = sh.getRange(ilk, anaNo, n, 1).getNotes();
      notlar.forEach(function (x, i) { if (String(x[0]).indexOf(MUKERRER_NOT) === 0) sh.getRange(ilk + i, anaNo).clearNote(); });
    }
    var satirlar = [];
    v.forEach(function (r, i) {
      if (!String(r[anaNo - 1]).trim()) return;
      satirlar.push({
        satir: ilk + i, deger: r[anaNo - 1],
        imza: s.anahtar === 'yayin' ? kunyeImza_(r[anaNo - 1]) : null,
        anahtar: kols.map(function (c) { return anahtarDeger_(s, c, r[sutunNo_(c) - 1]); }).join('|')
      });
    });
    var grupNo = {}, gruplar = [];
    satirlar.forEach(function (a, i) {
      for (var j = 0; j < i; j++) {
        var b = satirlar[j];
        var esit = a.imza ? yayinEsit_(a.imza, b.imza) : a.anahtar === b.anahtar;
        if (esit) {
          var g = grupNo[b.satir];
          if (g === undefined) { g = gruplar.length; gruplar.push([b]); grupNo[b.satir] = g; }
          gruplar[g].push(a); grupNo[a.satir] = g;
          break;
        }
      }
    });
    gruplar.forEach(function (g) {
      rapor.mukerrer.push({ kategori: s.baslik, sayfa: s.sayfa, satirlar: g.map(function (x) { return x.satir; }), ozet: String(g[0].deger).slice(0, 160) });
      if (isaretle) {
        g.slice(1).forEach(function (x) {
          sh.getRange(x.satir, anaNo).setNote(MUKERRER_NOT + ': ' + g[0].satir + '. satırla aynı kayıt (denetim ' + rapor.tarih + ').');
        });
      }
    });
  });

  // Kişi bazında durum ve künye–çıktı sayıları tutarlılığı (yalnızca bölüm kadrosu)
  var ciktiSh = null;
  try { ciktiSh = ciktiSayfasi_(); } catch (e) { rapor.ciktiHata = e.message; }
  var kalemEtiket = {};
  tumKalemler_().forEach(function (k) { kalemEtiket[k.satir] = k.etiket; });
  var kayitlar = {};
  SEMA.forEach(function (s) { kayitlar[s.anahtar] = satirlar_(ss, s.anahtar); });
  KADRO.kisiler.forEach(function (kisi) {
    var ka = kisiAnahtar_(kisi.ad);
    var kunyeSayisi = 0;
    SEMA.forEach(function (s) {
      var sahip = sahipSutunlari_(s);
      if (!sahip.length) return;
      kayitlar[s.anahtar].forEach(function (r) {
        if (sahip.some(function (c) { return katla_(r[c]) === ka.tam; }) || (s.ortakSutun && iliskili_(r[s.ortakSutun], ka))) kunyeSayisi++;
      });
    });
    var durum = { ad: kisi.unvan + ' ' + kisi.ad, kisa: kisi.kisa, kunye: kunyeSayisi, cikti: 'sütun yok' };
    if (ciktiSh) {
      var sutun = kisiSutunu_(ciktiSh, kisi.kisa);
      if (sutun) {
        var degerler = ciktiSh.getRange(1, sutun, 80, 1).getValues();
        var dolu = tumKalemler_().filter(function (k) { var x = degerler[k.satir - 1][0]; return x !== '' && x !== null; }).length;
        var toplam = tumKalemler_().length;
        durum.cikti = dolu === 0 ? 'girilmedi' : dolu < toplam ? 'eksik (' + dolu + '/' + toplam + ')' : 'tamam';
        if (dolu) {
          var oto = otoSayilar_(kisi.ad).sayilar;
          Object.keys(oto).forEach(function (satir) {
            var kayitli = degerler[Number(satir) - 1][0];
            if (kayitli !== '' && kayitli !== null && Number(kayitli) < oto[satir]) {
              rapor.tutarsizlik.push({ kisi: durum.ad, kalem: kalemEtiket[satir], kunye: oto[satir], cikti: Number(kayitli) });
            }
          });
        }
      }
    }
    rapor.kisiler.push(durum);
  });
  return rapor;
}

/** E-Tablo menüsü: denetimi çalıştırır, mükerrerleri not ile işaretler ve raporu gösterir. */
function denetimPenceresi() {
  var r = mukerrerDenetle(true);
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var h = '<style>body{font:14px Arial,sans-serif;color:#1d2433}h2{font-size:16px;margin:16px 0 6px}table{border-collapse:collapse;width:100%}' +
    'td,th{border-bottom:1px solid #dfe3ea;padding:5px;text-align:left;vertical-align:top}th{color:#5d6779}.ok{color:#1d7a46}.uy{color:#8a5a00;font-weight:bold}</style>';
  h += '<p>Denetim: ' + r.tarih + '</p><h2>Mükerrer kayıtlar</h2>';
  if (!r.mukerrer.length) h += '<p class="ok">✓ Mükerrer kayıt yok.</p>';
  else {
    h += '<p class="uy">' + r.mukerrer.length + ' mükerrer grup bulundu. Fazla satırların anahtar hücresine "⚠ Mükerrer" notu düşüldü; ilk satırı bırakıp diğerlerini silin.</p><table><tr><th>Sayfa</th><th>Satırlar</th><th>Kayıt</th></tr>';
    r.mukerrer.forEach(function (m) { h += '<tr><td>' + esc(m.sayfa) + '</td><td>' + m.satirlar.join(', ') + '</td><td>' + esc(m.ozet) + '</td></tr>'; });
    h += '</table>';
  }
  h += '<h2>Künye – çıktı sayıları tutarlılığı</h2>';
  if (r.ciktiHata) h += '<p class="uy">' + esc(r.ciktiHata) + '</p>';
  else if (!r.tutarsizlik.length) h += '<p class="ok">✓ Tutarsızlık yok.</p>';
  else {
    h += '<p class="uy">Künyedeki kayıt sayısı, çıktı sayıları dosyasındaki değerden fazla:</p><table><tr><th>Kişi</th><th>Kalem</th><th>Künye</th><th>Çıktı</th></tr>';
    r.tutarsizlik.forEach(function (t) { h += '<tr><td>' + esc(t.kisi) + '</td><td>' + esc(t.kalem) + '</td><td>' + t.kunye + '</td><td>' + t.cikti + '</td></tr>'; });
    h += '</table>';
  }
  h += '<h2>Kişi bazında durum</h2><table><tr><th>Öğretim elemanı</th><th>Künyede adının geçtiği kayıt</th><th>Çıktı sayıları</th></tr>';
  r.kisiler.forEach(function (k) {
    h += '<tr><td>' + esc(k.ad) + '</td><td>' + k.kunye + '</td><td class="' + (k.cikti === 'tamam' ? 'ok' : 'uy') + '">' + esc(k.cikti) + '</td></tr>';
  });
  h += '</table>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(h).setWidth(760).setHeight(620), 'Mükerrer ve tutarlılık denetimi');
}
