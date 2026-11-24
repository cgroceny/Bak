/**
 * Öğretim elemanı bazlı bilimsel çıktı sayıları (EEE_2026_Ciktilar).
 *
 * Dosyada satırlar çıktı türleri, E–T sütunları öğretim elemanlarıdır (7. satırda
 * kısaltmalar: VK, MEÖ, …). Formun son adımında kişinin sütunu, künyeden otomatik
 * hesaplanan değerlerle önerilir; kişi kontrol edip onaylayınca yazılır. Her kalem
 * için değer beklendiğinden 0 da yazılır.
 *
 * Künyeye yayın/patent/proje kaydedildiğinde otomatik satırlar (OTO_SATIRLAR) tüm
 * kadro için künyeden yeniden hesaplanıp yazılır; kişi son adımda kalan kalemleri onaylar.
 *
 * Dosyanın kimliği: Ayarlar.gs içindeki CIKTI_TABLO_ID ya da Komut dosyası
 * özelliği CIKTI_TABLO_ID.
 */

var CIKTI = {
  sayfa: '2026',
  baslikSatiri: 7,
  gruplar: [
    { baslik: 'Makale', kalemler: [
      { satir: 9, etiket: 'Web of Science: SCI(E), SSCI veya AHCI dergilerinde tam araştırma makalesi' },
      { satir: 10, etiket: 'Scopus’ta taranan dergilerde tam araştırma makalesi', ipucu: 'WoS’ta değil, Scopus’ta taranan dergiler. Künyede İndeks "Diğer" seçilmiş olabilir; o makaleleri "Diğer"den buraya taşıyınız.' },
      { satir: 11, etiket: 'ESCI dergilerinde tam araştırma makalesi' },
      { satir: 12, etiket: 'ULAKBİM TR Dizin dergilerinde tam araştırma makalesi' },
      { satir: 13, etiket: 'Diğer makaleler' }
    ] },
    { baslik: 'Kitap', kalemler: [
      { satir: 15, etiket: 'Uluslararası yayınevi: kitap veya kitap bölümü' },
      { satir: 16, etiket: 'Ulusal yayınevi: kitap veya kitap bölümü' }
    ] },
    { baslik: 'Patent ve Faydalı Model', kalemler: [
      { satir: 18, etiket: 'Uluslararası patent' },
      { satir: 19, etiket: 'Ulusal patent' },
      { satir: 20, etiket: 'Faydalı model' },
      { satir: 21, etiket: 'Ticari ürün' }
    ] },
    { baslik: 'Bilimsel Araştırma Projesi – Uluslararası', kalemler: [
      { satir: 24, etiket: 'Ufuk Avrupa (Horizon Europe)' },
      { satir: 25, etiket: 'COST' },
      { satir: 26, etiket: 'TÜBİTAK 1071' },
      { satir: 27, etiket: '2XXX ikili işbirliği programları' },
      { satir: 28, etiket: 'TÜBİTAK 1709–1719' },
      { satir: 29, etiket: 'Diğer uluslararası projeler' }
    ] },
    { baslik: 'Bilimsel Araştırma Projesi – Ulusal', kalemler: [
      { satir: 31, etiket: 'TÜBİTAK 1001' },
      { satir: 32, etiket: 'TÜBİTAK 1002' },
      { satir: 33, etiket: 'TÜBİTAK 1003' },
      { satir: 34, etiket: 'TÜBİTAK 1005' },
      { satir: 35, etiket: 'TÜBİTAK 1007' },
      { satir: 36, etiket: 'TÜBİTAK 3501' },
      { satir: 37, etiket: 'TÜSEB' },
      { satir: 38, etiket: 'Diğer ulusal projeler' }
    ] },
    { baslik: 'Bilimsel Araştırma Projesi – BAP', kaynak: 'bap', kalemler: [
      { satir: 40, etiket: 'GAP' }, { satir: 41, etiket: 'DAP' }, { satir: 42, etiket: 'ÖNP' },
      { satir: 43, etiket: 'TYL / TDR / TDU (tez projeleri)' }, { satir: 44, etiket: 'SAN' }, { satir: 45, etiket: 'YÖNP' },
      { satir: 46, etiket: 'ÖDL' }, { satir: 47, etiket: 'ALT' }, { satir: 48, etiket: 'TETAP' }, { satir: 49, etiket: 'EFP' },
      { satir: 50, etiket: 'YDP' }, { satir: 51, etiket: 'KDP' }, { satir: 52, etiket: 'Sürdürülebilir Kalkınma Amaçları odaklı projeler' }
    ] },
    { baslik: 'Bilimsel Toplantılar', kaynak: 'toplanti', kalemler: [
      { satir: 55, etiket: 'Uluslararası – düzenleme' },
      { satir: 56, etiket: 'Uluslararası – katılım', ipucu: 'Bildiri sunduğunuz ya da katıldığınız uluslararası etkinlik sayısı.' },
      { satir: 58, etiket: 'Ulusal – düzenleme' },
      { satir: 59, etiket: 'Ulusal – katılım' }
    ] },
    { baslik: 'Teknopark', kalemler: [
      { satir: 61, etiket: 'Teknopark şirketi' }
    ] },
    { baslik: 'Burslar – Doktora öncesi', kaynak: 'burs', kalemler: [
      { satir: 64, etiket: 'TÜBİTAK 2213' }, { satir: 65, etiket: 'TÜBİTAK 2214' }, { satir: 66, etiket: 'TÜBİTAK 2244' },
      { satir: 67, etiket: 'GEP' }, { satir: 68, etiket: 'Diğer' }
    ] },
    { baslik: 'Burslar – Doktora sonrası', kaynak: 'burs', kalemler: [
      { satir: 70, etiket: 'TÜBİTAK 2218' }, { satir: 71, etiket: 'TÜBİTAK 2219' }, { satir: 72, etiket: 'DOSAP' },
      { satir: 73, etiket: 'AKAP' }, { satir: 74, etiket: 'Diğer' }
    ] },
    { baslik: 'Konuk bilim insanı daveti (İKÇÜ’ye)', kalemler: [
      { satir: 76, etiket: 'TÜBİTAK 2216' }, { satir: 77, etiket: 'TÜBİTAK 2221' }, { satir: 78, etiket: 'Diğer' }
    ] }
  ]
};

/** Künyedeki proje türünün çıktı satırı karşılığı (yoksa elle girilir). */
var PROJE_SATIRI = {
  'COST': 25, 'TÜBİTAK 1001': 31, 'TÜBİTAK 1002': 32, 'TÜBİTAK 1003': 33, 'TÜBİTAK 1005': 34,
  'TÜBİTAK 1007': 35, 'TÜBİTAK 3501': 36, 'TÜSEB': 37, 'GAP': 40, 'BAP TEZ': 43,
  'TÜBİTAK 2218': 70, 'TÜBİTAK 2219': 71,
  'TÜBİTAK 1004': 38, 'TÜBİTAK 2209': 38, 'TÜBİTAK 3001': 38, 'TÜBİTAK 3005': 38, 'İZKA': 38, 'KOSGEB': 38
};

/** Künyeden otomatik hesaplanan satırlar: her kayıtta künyeyle eşitlenir, elle değiştirilmez. */
var OTO_SATIRLAR = (function () {
  var l = [9, 11, 12, 13, 15, 16, 18, 19, 20];
  Object.keys(PROJE_SATIRI).forEach(function (k) { if (l.indexOf(PROJE_SATIRI[k]) === -1) l.push(PROJE_SATIRI[k]); });
  return l;
})();

/** Künyeyi etkileyen kategoriler (kaydedilince çıktı sayıları eşitlenir). */
var CIKTI_ETKILEYEN = ['yayin', 'patent', 'proje'];

/**
 * Kişinin çıktı sayıları: otomatik satırlar künyeden, diğerleri dosyadaki değerler.
 */
function ciktiGetir(ad) {
  var kisi = kadroKisisi_(ad);
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var oto = otoSayilar_(ad, kunyeVerileri_(ss));
  var sonuc = { oto: oto.sayilar, otoSatirlar: OTO_SATIRLAR, kaynaklar: oto.kaynaklar, kayitli: {}, sutunVar: false };
  if (!kisi) return sonuc;
  var sh = ciktiSayfasi_();
  var sutun = kisiSutunu_(sh, kisi.kisa);
  if (!sutun) return sonuc;
  sonuc.sutunVar = true;
  sonuc.kisa = kisi.kisa;
  var degerler = sh.getRange(1, sutun, 80, 1).getValues();
  tumKalemler_().forEach(function (k) {
    var v = degerler[k.satir - 1][0];
    if (v !== '' && v !== null) sonuc.kayitli[k.satir] = Number(v);
  });
  var not = sh.getRange(CIKTI.baslikSatiri, sutun).getNote();
  sonuc.onay = (/Onaylandı: ([^\n]+)/.exec(not) || [])[1] || '';
  return sonuc;
}

/**
 * Kişinin onayı: elle girilen kalemler yazılır; otomatik satırlar künyeden hesaplanır
 * (formdan gelen değer dikkate alınmaz, böylece iki dosya hep tutarlı kalır).
 */
function ciktiKaydet(ad, degerler) {
  var kisi = kadroKisisi_(ad);
  if (!kisi) throw new Error('Çıktı sayıları tablosunda yalnızca bölüm kadrosunun sütunları vardır.');
  tumKalemler_().forEach(function (k) {
    if (OTO_SATIRLAR.indexOf(k.satir) !== -1) return;
    var v = degerler[k.satir];
    if (v === undefined || v === null || !/^\d+$/.test(String(v).trim())) {
      throw new Error('"' + k.etiket + '" için 0 veya pozitif bir tam sayı giriniz.');
    }
  });
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var sh = ciktiSayfasi_();
    var sutun = kisiSutunu_(sh, kisi.kisa);
    if (!sutun) throw new Error('Çıktı sayıları tablosunda "' + kisi.kisa + '" sütunu bulunamadı.');
    var ilk = KALEM_ILK, adet = KALEM_SON - KALEM_ILK + 1;
    var rng = sh.getRange(ilk, sutun, adet, 1), v = rng.getValues();
    tumKalemler_().forEach(function (k) {
      if (OTO_SATIRLAR.indexOf(k.satir) === -1) v[k.satir - ilk][0] = Number(String(degerler[k.satir]).trim());
    });
    rng.setValues(v);
    var simdi = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
    sh.getRange(CIKTI.baslikSatiri, sutun).setNote(kisi.ad + '\nOnaylandı: ' + simdi);
    SpreadsheetApp.flush();
  } finally {
    kilit.releaseLock();
  }
  var es = ciktiEsitle_(); // otomatik satırları künyeyle eşitle (13. satır Scopus'a göre düzeltilir)
  return { durum: 'tamam', tarih: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm'), esitlenen: es };
}

var KALEM_ILK = 9, KALEM_SON = 78;

/**
 * Tüm kadronun otomatik satırlarını künyeden yeniden hesaplayıp EEE_2026_Ciktilar'a yazar.
 * Boş kalan elle girilecek kalemlere 0 yazar; "Ortalama" sütununa formül koyar.
 * @return {string[]} değeri değişen kişilerin kısaltmaları
 */
function ciktiEsitle_() {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
    var veriler = kunyeVerileri_(ss);
    var sh = ciktiSayfasi_();
    var basliklar = sh.getRange(CIKTI.baslikSatiri, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    var sutunlar = {};
    basliklar.forEach(function (b, i) { sutunlar[String(b).trim().toLocaleUpperCase('tr')] = i + 1; });
    var kisiler = KADRO.kisiler.filter(function (k) { return sutunlar[k.kisa.toLocaleUpperCase('tr')]; });
    if (!kisiler.length) return [];
    var nolar = kisiler.map(function (k) { return sutunlar[k.kisa.toLocaleUpperCase('tr')]; });
    var c1 = Math.min.apply(null, nolar), c2 = Math.max.apply(null, nolar);
    var adet = KALEM_SON - KALEM_ILK + 1;
    var blok = sh.getRange(KALEM_ILK, c1, adet, c2 - c1 + 1);
    var v = blok.getValues();
    var kalemler = tumKalemler_();
    var degisen = [];
    kisiler.forEach(function (kisi, i) {
      var j = nolar[i] - c1;
      var oto = otoSayilar_(kisi.ad, veriler).sayilar;
      var degisti = false;
      var scopus = Number(v[10 - KALEM_ILK][j]) || 0;
      kalemler.forEach(function (k) {
        var eski = v[k.satir - KALEM_ILK][j], yeni;
        if (OTO_SATIRLAR.indexOf(k.satir) !== -1) {
          yeni = oto[k.satir] || 0;
          if (k.satir === 13) yeni = Math.max(0, yeni - scopus); // Scopus'a taşınanlar "Diğer"den düşülür
        } else {
          yeni = (eski === '' || eski === null) ? 0 : eski;
        }
        if (eski !== yeni) { v[k.satir - KALEM_ILK][j] = yeni; degisti = true; }
      });
      if (degisti) degisen.push(kisi.kisa);
    });
    if (degisen.length) blok.setValues(v);
    // Ortalama sütunu (varsa) boşsa formül
    var ort = sutunlar['ORTALAMA'];
    if (ort) {
      var harf1 = sh.getRange(1, c1).getA1Notation().replace(/\d+/, ''), harf2 = sh.getRange(1, c2).getA1Notation().replace(/\d+/, '');
      var oRng = sh.getRange(KALEM_ILK, ort, adet, 1), of = oRng.getFormulas(), ov = oRng.getValues(), yaz = false;
      kalemler.forEach(function (k) {
        var x = k.satir - KALEM_ILK;
        if (!of[x][0] && (ov[x][0] === '' || ov[x][0] === null)) {
          of[x][0] = '=IFERROR(ROUND(AVERAGE(' + harf1 + k.satir + ':' + harf2 + k.satir + '),2),"")'; yaz = true;
        } else if (!of[x][0]) { of[x][0] = ov[x][0]; }
      });
      if (yaz) oRng.setFormulas(of.map(function (r) { return [typeof r[0] === 'string' ? r[0] : String(r[0])]; }));
    }
    SpreadsheetApp.flush();
    return degisen;
  } finally {
    kilit.releaseLock();
  }
}

/** Hata kaydı bırakıp akışı bozmayan eşitleme (form kaydından sonra çağrılır). */
function ciktiEsitleGuvenli_() {
  try { return { esitlenen: ciktiEsitle_() }; } catch (e) { console.error('Çıktı eşitleme: ' + e.message); return { hata: e.message }; }
}

/** E-Tablo menüsü: tüm kadronun çıktı sayılarını künyeden günceller. */
function ciktiEsitleMenu() {
  var d = ciktiEsitle_();
  SpreadsheetApp.getUi().alert('EEE_2026_Ciktilar güncellendi.\n\nDeğeri değişen: ' + (d.length ? d.join(', ') : 'yok (zaten güncel)'));
}

/** Künye sayfalarını bir kez okur. */
function kunyeVerileri_(ss) {
  var v = {};
  ['yayin', 'patent', 'proje', 'bursTubitak', 'toplanti'].forEach(function (a) { v[a] = satirlar_(ss, a); });
  return v;
}

// ---------------------------------------------------------------------------

function otoSayilar_(ad, veriler) {
  var ka = kisiAnahtar_(ad);
  var say = {};
  var kaynaklar = { bap: [], proje: [], burs: [], toplanti: [] };
  var ekle = function (satir) { say[satir] = (say[satir] || 0) + 1; };
  if (!veriler) veriler = kunyeVerileri_(SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_()));

  veriler.yayin.forEach(function (r) {
    if (!(katla_(r.E) === ka.tam || iliskili_(r.J, ka))) return;
    if (r.B === 'Makale') {
      if (['SCI', 'SCIE', 'SSCI', 'AHCI'].indexOf(r.H) !== -1) ekle(9);
      else if (r.H === 'ESCI') ekle(11);
      else if (r.H === 'TR Dizin') ekle(12);
      else ekle(13);
    } else if (r.B === 'Kitap' || r.B === 'Kitap Bölümü') {
      ekle(r.F === 'Ulusal' ? 16 : 15);
    }
  });
  veriler.patent.forEach(function (r) {
    if (katla_(r.D) !== ka.tam) return;
    if (/\(Uluslararası Patent\)\s*$/.test(r.E)) ekle(18);
    else if (/\(Faydalı Model\)\s*$/.test(r.E)) ekle(20);
    else if (/\(Tasarım\)\s*$/.test(r.E)) return;
    else ekle(19);
  });
  veriler.proje.forEach(function (r) {
    if (!(katla_(r.G) === ka.tam || iliskili_(r.N, ka))) return;
    var hedef = PROJE_SATIRI[r.E];
    if (hedef) ekle(hedef);
    else kaynaklar[r.E === 'BAP' ? 'bap' : 'proje'].push(r.E + ': ' + r.F);
  });
  veriler.bursTubitak.forEach(function (r) {
    if (katla_(r.C) === ka.tam) kaynaklar.burs.push('TÜBİTAK (' + r.D + '): ' + (r.G || 'başlıksız') + ' – ' + r.H);
  });
  veriler.toplanti.forEach(function (r) {
    kaynaklar.toplanti.push(r.E + ' ' + r.D + ': ' + r.F + ' (' + r.H + ')');
  });
  return { sayilar: say, kaynaklar: kaynaklar };
}

/** Bir sayfanın dolu veri satırlarını {sütunHarfi: görünen değer} nesneleri olarak döndürür. */
function satirlar_(ss, anahtar) {
  var s = semaBul_(anahtar);
  var sh = ss.getSheetByName(s.sayfa);
  if (!sh) return [];
  var r = tabloAraligi_(ss, sh, s);
  var genislik = sutunNo_(s.tarihSutun);
  var girdi = girdiSutunlari_(s);
  return sh.getRange(r.getRow(), 1, r.getNumRows(), genislik).getDisplayValues().map(function (x) {
    var o = {};
    for (var c = 0; c < genislik; c++) o[String.fromCharCode(65 + c)] = x[c];
    return o;
  }).filter(function (o) { return girdi.some(function (c) { return o[c]; }); });
}

function tumKalemler_() {
  return CIKTI.gruplar.reduce(function (a, g) { return a.concat(g.kalemler); }, []);
}

function kadroKisisi_(ad) {
  var k = katla_(ad);
  return KADRO.kisiler.filter(function (x) { return katla_(x.ad) === k; })[0] || null;
}

function ciktiSayfasi_() {
  var id = '';
  try { id = PropertiesService.getScriptProperties().getProperty('CIKTI_TABLO_ID') || ''; } catch (e) { /* yoksay */ }
  if (!id && typeof CIKTI_TABLO_ID !== 'undefined') id = CIKTI_TABLO_ID;
  if (!id) throw new Error('Çıktı sayıları dosyası tanımlı değil (CIKTI_TABLO_ID).');
  var ss = SpreadsheetApp.openById(id);
  return ss.getSheetByName(CIKTI.sayfa) || ss.getSheets()[0];
}

function kisiSutunu_(sh, kisa) {
  var basliklar = sh.getRange(CIKTI.baslikSatiri, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var hedef = String(kisa).trim().toLocaleUpperCase('tr');
  for (var i = 0; i < basliklar.length; i++) {
    if (String(basliklar[i]).trim().toLocaleUpperCase('tr') === hedef) return i + 1;
  }
  return 0;
}
