/**
 * Yayınları otomatik getirme / Google Scholar'dan içe aktarma.
 *
 * Google Scholar'ın resmi bir API'si yoktur ve sayfalarının otomatik okunması
 * Scholar kullanım koşullarına aykırıdır (Google bu istekleri engeller). Bu
 * nedenle iki yol sunulur:
 *   1) yayinlariGetir : Açık akademik veritabanı OpenAlex'ten (api.openalex.org)
 *                       öğretim üyesinin İKÇÜ adresli yayınlarını getirir.
 *   2) bibtexAktar    : Scholar profilinde "Dışa aktar → BibTeX" ile alınan
 *                       metni çözer; mümkünse OpenAlex'ten DOI/dil/atıf ekler.
 * Her iki yol da kayıtları "Bilimsel yayın" sayfasının istediği biçime
 * (APA künye, tür, dil, yayım yeri, İKÇÜ'lü ortak yazarlar, atıf) dönüştürür.
 */

var OPENALEX = 'https://api.openalex.org';
var IKCU_OPENALEX = 'I250383648'; // İzmir Kâtip Çelebi Üniversitesi (ROR 024nx4843)
var OA_ALANLAR = 'id,doi,title,publication_year,type,language,cited_by_count,biblio,primary_location,authorships';

/**
 * Öğretim üyesinin yayınlarını OpenAlex'ten getirir.
 * @param {string} ad     Ad Soyad (unvansız)
 * @param {number} yil    Yayın yılı
 * @param {string} orcid  İsteğe bağlı ORCID (0000-0000-0000-0000)
 */
function yayinlariGetir(ad, yil, orcid) {
  yil = Number(yil) || RAPOR.yil;
  var yazarlar = yazarBul_(ad, orcid);
  if (!yazarlar.length) {
    return { yazarlar: [], kayitlar: [], bulunamadi: true };
  }
  var idler = yazarlar.map(function (a) { return kisaId_(a.id); });
  var r = oaGet_('/works', {
    filter: 'author.id:' + idler.join('|') + ',publication_year:' + yil,
    'per-page': 100, select: OA_ALANLAR, sort: 'publication_date:desc'
  });
  var mevcut = mevcutYayinlar_();
  var gorulen = {};
  var kayitlar = [];
  r.results.forEach(function (w) {
    if (ATLANACAK_TURLER.indexOf(w.type) !== -1) return;
    var k = oaKayit_(w, ad, idler, mevcut);
    var anahtar = k.doi || katla_(k.baslik);
    if (gorulen[anahtar]) return;
    gorulen[anahtar] = true;
    kayitlar.push(k);
  });
  return {
    yazarlar: yazarlar.map(function (a) { return { id: kisaId_(a.id), ad: a.display_name, yayin: a.works_count }; }),
    kayitlar: kayitlar
  };
}

/**
 * Google Scholar'dan dışa aktarılan BibTeX metnini kayıtlara dönüştürür.
 */
function bibtexAktar(metin, ad, yil) {
  yil = Number(yil) || RAPOR.yil;
  var girdiler = bibtexCoz_(metin);
  if (!girdiler.length) throw new Error('BibTeX metni çözülemedi. Scholar’da "Dışa aktar → BibTeX" sayfasındaki metnin tamamını yapıştırınız.');
  var yilaUygun = girdiler.filter(function (g) { return !g.year || Number(g.year) === yil; });
  var atlanan = girdiler.length - yilaUygun.length;
  yilaUygun = yilaUygun.slice(0, 60);

  // OpenAlex'te başlıkla eşleştir (DOI, dil, atıf, İKÇÜ'lü ortak yazarlar için)
  var anahtar = openAlexAnahtari_();
  var istekler = yilaUygun.map(function (g) {
    var p = { search: g.title, 'per-page': 3, select: OA_ALANLAR };
    if (anahtar) p.api_key = anahtar;
    return { url: OPENALEX + '/works?' + sorgu_(p), muteHttpExceptions: true };
  });
  var yanitlar = istekler.length ? UrlFetchApp.fetchAll(istekler) : [];
  var mevcut = mevcutYayinlar_();
  var benimIdler = [];
  try { benimIdler = yazarBul_(ad).map(function (a) { return kisaId_(a.id); }); } catch (e) { /* yoksay */ }

  var kayitlar = yilaUygun.map(function (g, i) {
    var w = null;
    if (yanitlar[i] && yanitlar[i].getResponseCode() === 200) {
      var sonuc = JSON.parse(yanitlar[i].getContentText()).results || [];
      var hedef = katla_(g.title);
      w = sonuc.filter(function (x) { return x.title && katla_(x.title) === hedef; })[0] || null;
    }
    if (w) {
      var k = oaKayit_(w, ad, benimIdler, mevcut);
      k.kaynak = 'Scholar + OpenAlex';
      return k;
    }
    return bibKayit_(g, ad, mevcut);
  });
  return { kayitlar: kayitlar, atlanan: atlanan, toplam: girdiler.length };
}

/** Seçilen kayıtları sırayla kaydeder; çıktı sayılarını sonda bir kez eşitler. */
function topluKaydet(anahtar, liste) {
  var sonuclar = liste.map(function (veri) {
    try {
      return kaydetIc_(anahtar, veri);
    } catch (e) {
      return { durum: 'hata', mesaj: e.message };
    }
  });
  if (CIKTI_ETKILEYEN.indexOf(anahtar) !== -1 && sonuclar.some(function (r) { return r.durum === 'tamam' || r.durum === 'ortakEklendi'; })) {
    ciktiEsitleGuvenli_();
  }
  return sonuclar;
}

// ---------------------------------------------------------------------------
// Dönüştürme
// ---------------------------------------------------------------------------

var ATLANACAK_TURLER = ['paratext', 'erratum', 'dataset', 'peer-review', 'grant', 'supplementary-materials', 'libguides', 'retraction'];

function oaKayit_(w, ad, benimIdler, mevcut) {
  var kaynak = (w.primary_location && w.primary_location.source) || {};
  var b = w.biblio || {};
  var yazarlar = (w.authorships || []).map(function (a) {
    return duzgunAd_(a.author && a.author.display_name || a.raw_author_name || '');
  });
  var tur = oaTur_(w, kaynak);
  var dil = dilAdi_(w.language, w.title);
  var dergi = kaynak.display_name || '';
  var yayinevi = kaynak.host_organization_name || '';
  var sayfa = sayfaMetni_(b.first_page, b.last_page);
  var doi = (w.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
  var ulusal = dil === 'Türkçe' || /dergipark|tr dizin|ulakbim/i.test(dergi + ' ' + yayinevi);

  var ikcuOrtak = (w.authorships || []).filter(function (a) {
    var id = a.author && kisaId_(a.author.id);
    if (benimIdler.indexOf(id) !== -1) return false;
    if (katla_(a.author && a.author.display_name) === katla_(ad)) return false;
    return (a.institutions || []).some(function (i) { return kisaId_(i.id) === IKCU_OPENALEX; });
  }).map(function (a) { return apaAd_(duzgunAd_(a.author.display_name)); });

  var apa = apaKunye_({
    yazarlar: yazarlar, yil: w.publication_year, baslik: w.title, tur: tur,
    kaynak: dergi, cilt: b.volume, sayi: b.issue, sayfa: sayfa, yayinevi: yayinevi, doi: doi
  });
  return {
    kaynak: 'OpenAlex', baslik: w.title || '', doi: doi, yil: w.publication_year,
    onbaski: w.type === 'preprint' || kaynak.type === 'repository',
    mevcut: mevcutMu_(w.title, doi, mevcut, ad),
    veri: {
      B: tur, C: apa, D: dil, E: ad, F: ulusal ? 'Ulusal' : 'Uluslararası',
      G: yayimYeri_(dergi, b.volume, b.issue, sayfa), J: ikcuOrtak.join('; '),
      M: w.cited_by_count != null ? String(w.cited_by_count) : ''
    }
  };
}

function bibKayit_(g, ad, mevcut) {
  var yazarlar = (g.author || '').split(/\s+and\s+/i).map(function (x) { return x.trim(); })
    .filter(function (x) { return x && x.toLowerCase() !== 'others'; });
  var tur = { article: 'Makale', inproceedings: 'Tam Bildiri', conference: 'Tam Bildiri', incollection: 'Kitap Bölümü',
    inbook: 'Kitap Bölümü', book: 'Kitap' }[g._tur] || 'Makale';
  var kaynak = g.journal || g.booktitle || '';
  var sayfa = (g.pages || '').replace(/-+/g, '–');
  var dil = dilAdi_(null, g.title);
  var apa = apaKunye_({
    yazarlar: yazarlar.map(duzgunAd_), yil: g.year, baslik: g.title, tur: tur, kaynak: kaynak,
    cilt: g.volume, sayi: g.number, sayfa: sayfa, yayinevi: g.publisher, doi: g.doi
  });
  return {
    kaynak: 'Scholar', baslik: g.title, doi: g.doi || '', yil: g.year, mevcut: mevcutMu_(g.title, g.doi, mevcut, ad),
    veri: {
      B: tur, C: apa, D: dil, E: ad, F: dil === 'Türkçe' ? 'Ulusal' : 'Uluslararası',
      G: yayimYeri_(kaynak, g.volume, g.number, sayfa), J: '', M: ''
    }
  };
}

function oaTur_(w, kaynak) {
  if (w.type === 'book-chapter') return 'Kitap Bölümü';
  if (w.type === 'book') return 'Kitap';
  if (kaynak.type === 'conference') return 'Tam Bildiri';
  if (/proceedings|conference|symposium|congress|workshop|kongre|sempozyum|konferans|bildiri/i.test(kaynak.display_name || '')) return 'Tam Bildiri';
  return 'Makale';
}

function dilAdi_(kod, baslik) {
  var k = { en: 'İngilizce', tr: 'Türkçe', de: 'Almanca' }[kod];
  if (k) return k;
  if (kod) return 'Diğer';
  return /[ğışçöüĞİŞÇÖÜ]/.test(baslik || '') ? 'Türkçe' : 'İngilizce';
}

/** APA 7 künyesi (düz metin). */
function apaKunye_(k) {
  var yazar = apaYazarlar_(k.yazarlar || []);
  var bas = (yazar ? yazar + ' ' : '') + '(' + (k.yil || 't.y.') + '). ' + noktali_(temizBaslik_(k.baslik));
  var doi = k.doi ? ' https://doi.org/' + k.doi : '';
  var sayfa = k.sayfa ? k.sayfa : '';
  if (k.tur === 'Makale') {
    var parca = [k.kaynak];
    if (k.cilt) parca.push(k.cilt + (k.sayi ? '(' + k.sayi + ')' : ''));
    else if (k.sayi) parca.push('(' + k.sayi + ')');
    if (sayfa) parca.push(sayfa);
    var kaynak = parca.filter(Boolean).join(', ');
    return bas + (kaynak ? ' ' + kaynak + '.' : '') + doi;
  }
  if (k.tur === 'Kitap') {
    return bas + (k.yayinevi ? ' ' + k.yayinevi + '.' : '') + doi;
  }
  // Kitap bölümü / bildiri
  var ic = k.kaynak ? ' In ' + k.kaynak + (sayfa ? ' (' + (sayfa.indexOf('–') !== -1 ? 'pp. ' : 'p. ') + sayfa + ')' : '') + '.' : '';
  return bas + ic + (k.yayinevi && k.tur === 'Kitap Bölümü' ? ' ' + k.yayinevi + '.' : '') + doi;
}

function apaYazarlar_(liste) {
  var a = liste.filter(Boolean).map(apaAd_);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length <= 20) return a.slice(0, -1).join(', ') + ', & ' + a[a.length - 1];
  return a.slice(0, 19).join(', ') + ', . . . ' + a[a.length - 1];
}

/** "Mehmet Erdal Özbek" ya da "Özbek, Mehmet Erdal" → "Özbek, M. E." */
function apaAd_(tam) {
  tam = String(tam || '').trim();
  var soyad, adlar;
  if (tam.indexOf(',') !== -1) {
    var p = tam.split(',');
    soyad = p[0].trim(); adlar = p.slice(1).join(' ').trim();
  } else {
    var t = tam.split(/\s+/);
    soyad = t.pop(); adlar = t.join(' ');
  }
  var bas = adlar.split(/\s+/).filter(Boolean).map(function (x) {
    return x.split('-').map(function (y) { return y.charAt(0).toLocaleUpperCase('tr') + '.'; }).join('-');
  }).join(' ');
  return soyad + (bas ? ', ' + bas : '');
}

/**
 * "Tuğba AKKAŞ" → "Tuğba Akkaş" (tamamı büyük harfli kelimeleri düzeltir);
 * kadrodaki bir kişiyse adı kadrodaki Türkçe yazımıyla verir ("Cem Gocen" → "Cem Göçen").
 */
function duzgunAd_(ad) {
  ad = String(ad || '').trim();
  if (ad.indexOf(',') !== -1) { // "Gocen, Cem" → "Cem Gocen"
    var p = ad.split(',');
    ad = (p.slice(1).join(' ').trim() + ' ' + p[0].trim()).trim();
  }
  var k = katla_(ad);
  for (var i = 0; i < KADRO.kisiler.length; i++) {
    if (katla_(KADRO.kisiler[i].ad) === k) return KADRO.kisiler[i].ad;
  }
  return String(ad || '').split(/\s+/).map(function (w) {
    if (w.length > 1 && w === w.toLocaleUpperCase('tr') && /[A-ZÇĞİÖŞÜ]{2}/.test(w)) {
      return w.charAt(0) + w.slice(1).toLocaleLowerCase('tr');
    }
    return w;
  }).join(' ').trim();
}

function temizBaslik_(b) { return String(b || '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim(); }
function noktali_(b) { return /[.?!]$/.test(b) ? b : b + '.'; }

function sayfaMetni_(ilk, son) {
  if (!ilk) return '';
  if (!son || son === ilk) return String(ilk);
  return ilk + '–' + son;
}

function yayimYeri_(kaynak, cilt, sayi, sayfa) {
  var p = [kaynak];
  if (cilt) p.push(cilt + (sayi ? '(' + sayi + ')' : ''));
  if (sayfa) p.push(sayfa);
  var m = p.filter(Boolean).join(', ');
  return m ? m + '.' : '';
}

// ---------------------------------------------------------------------------
// OpenAlex yardımcıları
// ---------------------------------------------------------------------------

function yazarBul_(ad, orcid) {
  if (orcid) {
    var o = String(orcid).replace(/^https?:\/\/orcid\.org\//i, '').trim();
    if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(o)) throw new Error('ORCID numarası 0000-0000-0000-0000 biçiminde olmalıdır.');
    return oaGet_('/authors', { filter: 'orcid:' + o, 'per-page': 5 }).results;
  }
  if (!ad) return [];
  var r = oaGet_('/authors', { search: ad, filter: 'affiliations.institution.id:' + IKCU_OPENALEX, 'per-page': 10 }).results;
  var hedef = katla_(ad);
  var tam = r.filter(function (a) { return katla_(a.display_name) === hedef; });
  if (tam.length) return tam;
  // "Mehmet Erdal Özbek" ↔ "M. Erdal Özbek" gibi: soyad + ilk harf eşleşmesi
  var t = hedef.split(' ');
  return r.filter(function (a) {
    var u = katla_(a.display_name).split(' ');
    return u[u.length - 1] === t[t.length - 1] && u[0].charAt(0) === t[0].charAt(0);
  });
}

function oaGet_(yol, parametre) {
  var anahtar = openAlexAnahtari_();
  if (anahtar) parametre.api_key = anahtar;
  var url = OPENALEX + yol + '?' + sorgu_(parametre);
  var y;
  for (var deneme = 0; deneme < 3; deneme++) {
    y = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (y.getResponseCode() !== 429 && y.getResponseCode() < 500) break;
    Utilities.sleep(1500 * (deneme + 1));
  }
  var kod = y.getResponseCode();
  if (kod === 429) {
    throw new Error('Yayın veritabanı (OpenAlex) şu an çok yoğun. Birkaç dakika sonra tekrar deneyiniz ya da "Google Scholar’dan aktar" seçeneğini kullanınız.');
  }
  if (kod !== 200) {
    throw new Error('Yayın veritabanı (OpenAlex) yanıt vermedi (kod ' + kod + '). "Google Scholar’dan aktar" seçeneğini kullanabilirsiniz.');
  }
  return JSON.parse(y.getContentText());
}

/**
 * OpenAlex API anahtarı (ücretsiz: https://openalex.org/settings/api-key).
 * Apps Script, Google'ın ortak IP'lerinden istek attığı için anahtarsız
 * isteklerde kota sık dolar. Anahtar, Proje Ayarları → Komut dosyası
 * özellikleri → OPENALEX_API_KEY olarak girilir (koda yazılmaz).
 */
function openAlexAnahtari_() {
  try {
    var k = PropertiesService.getScriptProperties().getProperty('OPENALEX_API_KEY');
    if (k) return k;
  } catch (e) { /* yoksay */ }
  // Alternatif: depoya eklenmeyen Ayarlar.gs dosyasında tanımlı sabit
  return typeof OPENALEX_API_KEY !== 'undefined' ? OPENALEX_API_KEY : '';
}

function sorgu_(p) {
  return Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
}

function kisaId_(id) { return String(id || '').split('/').pop(); }

/** Türkçe karakterleri ve aksanları sadeleştirip karşılaştırma anahtarı üretir. */
function katla_(s) {
  var tablo = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
  return String(s || '').replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (c) { return tablo[c]; })
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** "Bilimsel yayın" sayfasındaki mevcut künyeler (mükerrer işareti için). */
function mevcutYayinlar_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var s = semaBul_('yayin');
  var sh = ss.getSheetByName(s.sayfa);
  if (!sh) return [];
  var r = tabloAraligi_(ss, sh, s);
  var v = sh.getRange(r.getRow(), 1, r.getNumRows(), sutunNo_('J')).getDisplayValues();
  return v.map(function (x, i) {
    return { satir: r.getRow() + i, imza: kunyeImza_(x[sutunNo_('C') - 1]), giren: x[sutunNo_('E') - 1], ortak: x[sutunNo_('J') - 1] };
  }).filter(function (x) { return x.imza.tum; });
}

/**
 * Yayın tabloda var mı? Varsa kimin girdiğini ve kişinin zaten ilişkili
 * (kendisi girmiş ya da ortak yazar olarak ekli) olup olmadığını döndürür.
 */
function mevcutMu_(baslik, doi, mevcut, ad) {
  var b = katla_(baslik);
  doi = String(doi || '').toLowerCase();
  var ka = kisiAnahtar_(ad);
  for (var i = 0; i < mevcut.length; i++) {
    var m = mevcut[i];
    if ((doi && m.imza.doi === doi) || (b.length >= 12 && (m.imza.baslik === b || m.imza.tum.indexOf(b) !== -1))) {
      return {
        satir: m.satir, giren: m.giren,
        iliskili: katla_(m.giren) === ka.tam || iliskili_(m.ortak, ka)
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// BibTeX çözücü (Google Scholar çıktısı için yeterli)
// ---------------------------------------------------------------------------

function bibtexCoz_(metin) {
  var girdiler = [];
  var re = /@(\w+)\s*\{\s*([^,\s]*)\s*,/g;
  var m;
  while ((m = re.exec(metin)) !== null) {
    var tur = m[1].toLowerCase();
    if (tur === 'comment' || tur === 'string' || tur === 'preamble') continue;
    var i = re.lastIndex, derinlik = 1, bas = i;
    while (i < metin.length && derinlik > 0) {
      var c = metin.charAt(i);
      if (c === '{') derinlik++;
      else if (c === '}') derinlik--;
      i++;
    }
    var govde = metin.slice(bas, i - 1);
    var g = alanlariCoz_(govde);
    g._tur = tur;
    if (g.title) girdiler.push(g);
    re.lastIndex = i;
  }
  return girdiler;
}

function alanlariCoz_(govde) {
  var g = {}, i = 0, n = govde.length;
  while (i < n) {
    var m = /^\s*,?\s*([A-Za-z_-]+)\s*=\s*/.exec(govde.slice(i));
    if (!m) break;
    var anahtar = m[1].toLowerCase();
    i += m[0].length;
    var deger = '';
    var c = govde.charAt(i);
    if (c === '{') {
      var d = 1, j = i + 1;
      while (j < n && d > 0) { if (govde.charAt(j) === '{') d++; else if (govde.charAt(j) === '}') d--; j++; }
      deger = govde.slice(i + 1, j - 1); i = j;
    } else if (c === '"') {
      var k = govde.indexOf('"', i + 1); if (k === -1) k = n;
      deger = govde.slice(i + 1, k); i = k + 1;
    } else {
      var e = /^[^,}\s]*/.exec(govde.slice(i))[0];
      deger = e; i += e.length;
    }
    g[anahtar] = latexTemizle_(deger);
  }
  return g;
}

function latexTemizle_(s) {
  var aksan = { '"': '̈', "'": '́', '`': '̀', '^': '̂', '~': '̃', '=': '̄',
    '.': '̇', c: '̧', u: '̆', v: '̌' };
  return String(s)
    .replace(/\\([`'"^~=.]|[cuv](?=[\s{]))\s*\{?\s*(\\i|[A-Za-z])\s*\}?/g, function (t, a, b) {
      return ((b === '\\i' ? 'i' : b) + aksan[a]).normalize('NFC');
    })
    .replace(/\\i\b/g, 'ı').replace(/\\&/g, '&')
    .replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
