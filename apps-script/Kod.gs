/**
 * BAK 2026 Çıktı Künye – Veri Giriş Formu (Google Apps Script)
 *
 * Bu betik, "XXXX_BAK_2026_CiktiKunye" Excel dosyasının Google E-Tablolar'a
 * dönüştürülmüş kopyasına bağlanır ve öğretim üyelerinin veri girişini
 * tek bir form üzerinden yapmasını sağlar:
 *   - E-Tablo içinde "BAK Veri Girişi" menüsü (form penceresi)
 *   - Web uygulaması olarak yayınlanırsa: öğretim üyeleri yalnızca bir
 *     bağlantıya tıklayarak formu kullanır, tabloya erişmeleri gerekmez.
 *
 * Form her kaydı ilgili sayfadaki ilk BOŞ satıra yazar, "Veri Giriş Tarihi"
 * sütununa sabit tarih koyar (TODAY() formülü her gün değiştiği için) ve
 * tablo dolarsa altına otomatik yeni satır ekler.
 *
 * Kurulum adımları için README.md dosyasına bakınız.
 */

// ---------------------------------------------------------------------------
// Ortak listeler (Excel dosyasındaki açılır listelerle birebir aynıdır)
// ---------------------------------------------------------------------------
var BOLUMLER = [
  'Bilgisayar Müh.', 'Biyomedikal Müh.', 'Elektrik Elektronik Müh.', 'Harita Müh.',
  'İnşaat Müh.', 'Makine Müh.', 'Mekatronik Müh.', 'Metalurji ve Malzeme Müh.',
  'Mimarlık', 'Mühendislik Bilimleri', 'Petrol ve Doğalgaz Müh.',
  'Şehir ve Bölge Planlama', 'Yapay Zeka ve Veri Mühendisliği'
];
/**
 * Elektrik-Elektronik Mühendisliği akademik kadrosu (formda "adınızı seçin" listesi).
 * Kaynak: https://eee.ikcu.edu.tr/Personel/Akademik/1048 (23.11.2026).
 * Kadro değiştiğinde bu listeyi güncelleyiniz. Listede olmayanlar adını elle yazabilir.
 */
var KADRO = {
  bolum: 'Elektrik Elektronik Müh.',
  kisiler: [
    { unvan: 'Prof. Dr.', ad: 'Adnan Kaya', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Prof. Dr.', ad: 'Merih Palandöken', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Prof. Dr.', ad: 'Savaş Şahin', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Doç. Dr.', ad: 'Kamil Çetin', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Doç. Dr.', ad: 'Mehmet Erdal Özbek', abd: 'Telekomünikasyon' },
    { unvan: 'Doç. Dr.', ad: 'Volkan Kılıç', abd: 'Devreler ve Sistemler' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Erhan Demirok', abd: 'Elektrik Tesisleri' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Meryem Deniz', abd: 'Elektronik' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Saadet Simay Göztepe', abd: 'Telekomünikasyon' },
    { unvan: 'Öğr. Gör. Dr.', ad: 'Ferhat Bayram', abd: 'Elektrik Makinaları' },
    { unvan: 'Arş. Gör. Dr.', ad: 'Cem Göçen', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Arş. Gör. Dr.', ad: 'İsmail Akdağ', abd: 'Devreler ve Sistemler' },
    { unvan: 'Arş. Gör. Dr.', ad: 'Mehmet Uğur Soydemir', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Arş. Gör.', ad: 'Burcu Barış', abd: 'Telekomünikasyon' },
    { unvan: 'Arş. Gör.', ad: 'Mehmet İhsan Hekimhan', abd: 'Elektrik Makinaları' },
    { unvan: 'Arş. Gör.', ad: 'Onur Karadal', abd: 'Telekomünikasyon' }
  ]
};

var ULUSAL = ['Ulusal', 'Uluslararası'];
var EVET_HAYIR = ['Evet', 'Hayır'];

/**
 * Sayfa şeması. Her kategori:
 *   sayfa      : E-Tablodaki sayfa adı (birebir)
 *   ilk, son   : Veri satırlarının ilk ve son satırı (örnek satır hariç)
 *   tarihSutun : "Veri Giriş Tarihi" sütunu (otomatik doldurulur)
 *   sabit      : Her satıra otomatik yazılan sabit değerler {sutun: değer}
 *   yil        : Bu sütuna kayıt yılı otomatik yazılır
 *   tekrar     : Aynı değer varsa kullanıcıyı uyaran sütun (mükerrer kontrol)
 *   alanlar    : Form alanları
 *       tip: metin | uzunMetin | liste | tarih | sayi | yuzde | ad | bolum | tarihAraligi
 *       ad  : Kullanıcının "Ad Soyad" bilgisiyle ön doldurulur
 *       bolum: Kullanıcının bölüm bilgisiyle ön doldurulur
 */
var SEMA = [
  {
    anahtar: 'yayin', baslik: 'Bilimsel Yayın', simge: '📄',
    aciklama: 'Makale, bildiri, kitap, kitap bölümü',
    uyari: 'Sadece bu yıl yayımlanmış/basılmış çalışmalarınızı ekleyiniz.',
    sayfa: 'Bilimsel yayın', ilk: 12, son: 104, tarihSutun: 'N', tekrar: 'C',
    alanlar: [
      { sutun: 'B', etiket: 'Yayın Türü', tip: 'liste', zorunlu: true,
        secenekler: ['Makale', 'Sözlü (Özet) Bildiri', 'Poster', 'Tam Bildiri', 'Kitap Bölümü', 'Kitap'] },
      { sutun: 'C', etiket: 'Yayın Adı (APA formatında)', tip: 'uzunMetin', zorunlu: true,
        ipucu: 'Yazarlar, yıl, başlık, dergi, cilt(sayı), sayfa – APA formatında.',
        ornek: 'Cao, X., Kose, C., Selby, C. P., & Sancar, A. (2024). In vitro DNA repair genomics ... PNAS, 120(43), e2314233120.' },
      { sutun: 'D', etiket: 'Dili', tip: 'liste', zorunlu: true, secenekler: ['Türkçe', 'İngilizce', 'Almanca', 'Diğer'] },
      { sutun: 'E', etiket: 'Yayın Sahibi', tip: 'ad', zorunlu: true },
      { sutun: 'F', etiket: 'Yayım Alanı', tip: 'liste', zorunlu: true, secenekler: ULUSAL },
      { sutun: 'G', etiket: 'Yayım Yeri Adı, No’su, Sayfa No’su', tip: 'metin',
        ornek: 'Proceedings of the National Academy of Sciences, 120(43), e2314233120.' },
      { sutun: 'H', etiket: 'İndeks Adı', tip: 'liste', secenekler: ['SCI', 'SSCI', 'SCIE', 'AHCI', 'ESCI', 'TR Dizin', 'Diğer'] },
      { sutun: 'I', etiket: 'Bağlı Olduğunuz Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'J', etiket: 'MMF İçinden Ortak Yazarlar', tip: 'uzunMetin',
        ipucu: 'MMF içinden başka yazar yoksa boş bırakınız.', ornek: 'Cao, X.; Kose, C.' },
      { sutun: 'K', etiket: 'Dergi Impact Factor (son 5 yıl)', tip: 'metin', ipucu: 'Yoksa "yok" yazınız.', ornek: '3.25' },
      { sutun: 'L', etiket: 'Q Grubu', tip: 'liste', secenekler: ['Q1', 'Q2', 'Q3', 'Q4', 'Yok'] },
      { sutun: 'M', etiket: 'Toplam Atıf Sayısı', tip: 'sayi', ornek: '0' }
    ]
  },
  {
    anahtar: 'proje', baslik: 'Bilimsel Araştırma Projesi', simge: '🔬',
    aciklama: 'Yürütücüsü olduğunuz devam eden/tamamlanan projeler',
    uyari: 'Bu yıl yürütücüsü olduğunuz devam eden veya tamamlanmış projeleri ekleyiniz.',
    sayfa: 'Projeler', ilk: 10, son: 154, tarihSutun: 'R', yil: 'D', tekrar: 'F',
    alanlar: [
      { sutun: 'E', etiket: 'Proje Türü', tip: 'liste', zorunlu: true,
        secenekler: ['BAP TEZ', 'BAP', 'GAP', 'COST', 'İZKA', 'KOSGEB', 'TÜSEB', 'TÜBİTAK 1001', 'TÜBİTAK 1002',
          'TÜBİTAK 1003', 'TÜBİTAK 1004', 'TÜBİTAK 1005', 'TÜBİTAK 1007', 'TÜBİTAK 2209', 'TÜBİTAK 2218',
          'TÜBİTAK 2219', 'TÜBİTAK 3001', 'TÜBİTAK 3005', 'TÜBİTAK 3501', 'DİĞER'] },
      { sutun: 'F', etiket: 'Proje Adı', tip: 'uzunMetin', zorunlu: true },
      { sutun: 'G', etiket: 'Proje Yürütücüsü', tip: 'ad', zorunlu: true },
      { sutun: 'K', etiket: 'Bölüm / Anabilim Dalı', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Tamamlanma Durumu', tip: 'yuzde', zorunlu: true },
      { sutun: 'H', etiket: 'Proje Bütçesi (TL)', tip: 'sayi', ornek: '50000' },
      { sutun: 'I', etiket: 'Harcanan (TL)', tip: 'sayi', ornek: '25000' },
      { sutun: 'J', etiket: 'Proje Süresi (Ay)', tip: 'sayi', ornek: '24' },
      { sutun: 'L', etiket: 'Proje Başlama Tarihi', tip: 'tarih' },
      { sutun: 'M', etiket: 'Proje Bitiş Tarihi', tip: 'tarih' },
      { sutun: 'N', etiket: 'Araştırmacı Öğretim Üyelerinin Adı', tip: 'uzunMetin', ipucu: 'Her isim ayrı satıra.' },
      { sutun: 'O', etiket: 'TTO & Teknokent Projesi mi?', tip: 'liste', secenekler: EVET_HAYIR },
      { sutun: 'P', etiket: 'Uluslararası İşbirliği', tip: 'liste', secenekler: EVET_HAYIR },
      { sutun: 'Q', etiket: 'Uluslararası Fon Oranı', tip: 'yuzde' }
    ]
  },
  {
    anahtar: 'toplanti', baslik: 'Bilimsel Toplantı / Faaliyet', simge: '🎤',
    aciklama: 'Birimin düzenlediği kongre, konferans, seminer vb.',
    uyari: 'Sadece bu yıl yapılmış faaliyetleri ekleyiniz.',
    sayfa: 'Bilimsel toplanti ve Faaliyet', ilk: 9, son: 44, tarihSutun: 'I', tekrar: 'F',
    alanlar: [
      { sutun: 'C', etiket: 'Düzenleyen Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'D', etiket: 'Bilimsel Toplantı Türü', tip: 'liste', zorunlu: true,
        secenekler: ['Sempozyum/Kongre', 'Konferans', 'Panel', 'Eğitim Semineri', 'Diğer Seminerler', 'Açık oturum',
          'Söyleşi', 'Tiyatro', 'Konser', 'Sergi', 'Turnuva', 'Teknik gezi'] },
      { sutun: 'E', etiket: 'Yayım Alanı', tip: 'liste', zorunlu: true, secenekler: ['Ulusal', 'Uluslararası', 'Yerel (Üniversite içi)'] },
      { sutun: 'F', etiket: 'Konusu / Adı', tip: 'metin', zorunlu: true, ornek: 'ICHE 2026' },
      { sutun: 'G', etiket: 'Yer', tip: 'metin', ornek: 'İzmir' },
      { sutun: 'H', etiket: 'Tarih Aralığı', tip: 'tarihAraligi', zorunlu: true }
    ]
  },
  {
    anahtar: 'patent', baslik: 'Patent / Faydalı Model / Tasarım', simge: '💡',
    aciklama: 'Bu yıl yapılan başvurular',
    sayfa: 'Patent', ilk: 9, son: 25, tarihSutun: 'I', sabit: { B: 'MMF' }, tekrar: 'E',
    alanlar: [
      { sutun: 'C', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'D', etiket: 'Başvuru Yapan Adı Soyadı', tip: 'ad', zorunlu: true },
      { sutun: 'E', etiket: 'Patent Adı', tip: 'metin', zorunlu: true },
      { sutun: 'F', etiket: 'Patent Başvuru Tarihi', tip: 'tarih', zorunlu: true },
      { sutun: 'G', etiket: 'Patent Sonuçlanma Tarihi', tip: 'tarih' },
      { sutun: 'H', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Olumlu', 'Olumsuz', 'Değerlendirmede'] }
    ]
  },
  {
    anahtar: 'odul', baslik: 'Ödül', simge: '🏆',
    aciklama: 'YÖK, TÜBA, TÜBİTAK Bilim, Teşvik ve Sanat Ödülleri',
    sayfa: 'Ödüller', ilk: 6, son: 31, tarihSutun: 'H',
    alanlar: [
      { sutun: 'B', etiket: 'Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Ödül Verilen Öğretim Üyesi', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Ödül Türü', tip: 'liste', zorunlu: true, secenekler: ['Bilim Ödülü', 'Teşvik Ödülü', 'Sanat Ödülü'] },
      { sutun: 'E', etiket: 'Veren Kurum', tip: 'metin', zorunlu: true, ornek: 'TÜBİTAK' },
      { sutun: 'F', etiket: 'Veriliş Tarihi', tip: 'tarih', zorunlu: true },
      { sutun: 'G', etiket: 'Ödül Sebebi', tip: 'metin', ornek: 'Bilimsel Yayın' }
    ]
  },
  {
    anahtar: 'bursTubitak', baslik: 'TÜBİTAK Araştırma Bursu', simge: '🎓',
    aciklama: 'TÜBİTAK’ın verdiği ulusal/uluslararası araştırma bursu',
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'I', ozet: ['G', 'D', 'H'],
    alanlar: [
      { sutun: 'B', etiket: 'Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Burs Verilen Öğretim Üyesi', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Türü', tip: 'liste', zorunlu: true, secenekler: ULUSAL },
      { sutun: 'E', etiket: 'Başlama Tarihi', tip: 'tarih' },
      { sutun: 'F', etiket: 'Bitiş Tarihi', tip: 'tarih' },
      { sutun: 'G', etiket: 'Araştırmanın Başlığı (varsa)', tip: 'metin' },
      { sutun: 'H', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Devam eden', 'Tamamlanmış', 'İptal edilmiş'] }
    ]
  },
  {
    anahtar: 'bursArge', baslik: 'Kurum Destekli Ar-Ge Projesi', simge: '🏢',
    aciklama: 'Özel veya resmi kurumların desteklediği Ar-Ge projesi',
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'R', ozet: ['P', 'M', 'Q'],
    alanlar: [
      { sutun: 'K', etiket: 'Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'L', etiket: 'Destek Verilen Öğretim Üyesi', tip: 'ad', zorunlu: true },
      { sutun: 'M', etiket: 'Türü', tip: 'liste', zorunlu: true, secenekler: ULUSAL },
      { sutun: 'N', etiket: 'Başlama Tarihi', tip: 'tarih' },
      { sutun: 'O', etiket: 'Bitiş Tarihi', tip: 'tarih' },
      { sutun: 'P', etiket: 'Araştırmanın Başlığı (varsa)', tip: 'metin' },
      { sutun: 'Q', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Devam eden', 'Tamamlanmış', 'İptal edilmiş'] }
    ]
  },
  {
    anahtar: 'editorluk', baslik: 'Editörlük ve Hakemlik', simge: '📝',
    aciklama: 'Bu yıl editörlük yaptığınız kitap / hakemlik yaptığınız dergi sayısı',
    sayfa: 'Editörlük ve hakemlik', ilk: 8, son: 27, tarihSutun: 'G',
    enAzBiri: ['D', 'F'], ozet: ['D', 'F'], ozetEtiket: { D: 'Editörlük (kitap)', F: 'Hakemlik (dergi)' },
    alanlar: [
      { sutun: 'B', etiket: 'Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: null, anahtar: 'adSoyad', etiket: 'Öğretim Üyesi', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Editörlük Yaptığı Kitap Sayısı (1 yılda)', tip: 'sayi', ornek: '1' },
      { sutun: 'F', etiket: 'Hakemlik Yaptığı Dergi Sayısı (1 yılda)', tip: 'sayi', ornek: '4' }
    ],
    // Ad, yalnızca ilgili sayı girildiyse "Editörlük Yapan" (C) / "Hakemlik Yapan" (E) sütununa yazılır.
    kosulluAd: { C: 'D', E: 'F' }
  },
  {
    anahtar: 'egitici', baslik: 'Eğitici Eğitimi Faaliyeti', simge: '👩‍🏫',
    aciklama: 'Aldığınız eğitici eğitimleri (herhangi bir yıl olabilir)',
    sayfa: 'Eğitici Eğitimi Faaliyetleri', ilk: 5, son: 30, tarihSutun: 'I',
    alanlar: [
      { sutun: 'B', etiket: 'Alt Birim', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Eğitim Alan Öğretim Üyesi', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Eğitici Eğitim Faaliyeti', tip: 'liste', zorunlu: true,
        secenekler: ['Öğrenme Yönetim Sistemi', 'Eğitici Özellikleri', 'Eğitimde Danışmanlık', 'Dijital Öğretme Yöntemleri',
          'Program Geliştirme', 'Öğrenme-Öğretim Yöntemleri', 'Ölçme-Değerlendirme', 'İletişim Becerileri',
          'Eğitimde 21.yy Becerileri', 'Pedagojik Formasyon'] },
      { sutun: 'E', etiket: 'Türü', tip: 'liste', zorunlu: true, secenekler: ['Proje Eğitimi', 'Sertifika Eğitimi', 'Yüksek Lisans Eğitimi', 'Diğer'] },
      { sutun: 'F', etiket: 'Türü "Diğer" ise açıklayınız', tip: 'metin', goster: { sutun: 'E', deger: 'Diğer' } },
      { sutun: 'G', etiket: 'Veren Kurum', tip: 'metin', ornek: 'İKÇÜ Eğitim Fakültesi' },
      { sutun: 'H', etiket: 'Veriliş Tarihi', tip: 'tarih' }
    ]
  }
];

var TARIH_BICIMI = 'dd.MM.yyyy';

// ---------------------------------------------------------------------------
// Giriş noktaları
// ---------------------------------------------------------------------------

/** E-Tablo açıldığında menü ekler. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 BAK Veri Girişi')
    .addItem('Veri giriş formunu aç', 'formuAc')
    .addSeparator()
    .addItem('Web uygulaması bağlantısını göster', 'baglantiGoster')
    .addToUi();
}

/** Formu E-Tablo içinde büyük bir pencerede açar. */
function formuAc() {
  var html = sayfaOlustur_().setWidth(980).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, 'BAK 2026 – Veri Girişi');
}

/** Web uygulaması olarak yayınlandığında çalışır. */
function doGet() {
  return sayfaOlustur_()
    .setTitle('BAK 2026 Veri Girişi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function baglantiGoster() {
  var url = ScriptApp.getService().getUrl();
  var mesaj = url
    ? 'Öğretim üyeleriyle paylaşacağınız bağlantı:\n\n' + url
    : 'Henüz web uygulaması olarak yayınlanmamış.\n\nApps Script düzenleyicisinde: Dağıt → Yeni dağıtım → Tür: Web uygulaması.';
  SpreadsheetApp.getUi().alert(mesaj);
}

function sayfaOlustur_() {
  var t = HtmlService.createTemplateFromFile('Form');
  t.semaJson = JSON.stringify({ sema: SEMA, bolumler: BOLUMLER, kadro: KADRO });
  return t.evaluate();
}

// ---------------------------------------------------------------------------
// Kayıt
// ---------------------------------------------------------------------------

/**
 * Formdan gelen kaydı ilgili sayfaya yazar.
 * @param {string} anahtar  Şemadaki kategori anahtarı
 * @param {Object} veri     {sutunHarfi | alanAnahtari: değer}
 * @param {boolean} zorla   Mükerrer uyarısına rağmen kaydet
 * @return {Object} {durum: 'tamam'|'tekrar', sayfa, satir}
 */
function kaydet(anahtar, veri, zorla) {
  var s = semaBul_(anahtar);
  dogrula_(s, veri);

  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
    var sh = ss.getSheetByName(s.sayfa);
    if (!sh) throw new Error('"' + s.sayfa + '" sayfası bulunamadı. Sayfa adını değiştirmeyiniz.');

    var aralik = tabloAraligi_(ss, sh, s);
    var ilk = aralik.getRow();
    var son = ilk + aralik.getNumRows() - 1;
    var girdiSutunlari = girdiSutunlari_(s);

    // Mükerrer kontrolü
    if (s.tekrar && !zorla && veri[s.tekrar]) {
      var sutunNo = sutunNo_(s.tekrar);
      var degerler = sh.getRange(ilk, sutunNo, son - ilk + 1, 1).getDisplayValues();
      var aranan = normalize_(veri[s.tekrar]);
      for (var i = 0; i < degerler.length; i++) {
        if (normalize_(degerler[i][0]) === aranan) {
          return { durum: 'tekrar', sayfa: s.sayfa, satir: ilk + i };
        }
      }
    }

    // İlk boş satırı bul
    var satir = ilkBosSatir_(sh, ilk, son, girdiSutunlari);
    if (satir === -1) {
      sh.insertRowsAfter(son, 1);
      var genislik = sh.getMaxColumns();
      var kaynak = sh.getRange(son, 1, 1, genislik);
      var hedef = sh.getRange(son + 1, 1, 1, genislik);
      kaynak.copyTo(hedef, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      kaynak.copyTo(hedef, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
      satir = son + 1;
      ss.setNamedRange(aralikAdi_(s), sh.getRange(ilk, 1, satir - ilk + 1, 1));
    }

    // Değerleri yaz
    var yazilacak = {};
    s.alanlar.forEach(function (a) {
      if (!a.sutun) return;
      if (a.goster && veri[a.goster.sutun] !== a.goster.deger) return;
      var v = degerDonustur_(a, veri[a.sutun]);
      if (v !== '') yazilacak[a.sutun] = { deger: v, alan: a };
    });
    if (s.kosulluAd) {
      Object.keys(s.kosulluAd).forEach(function (hedefSutun) {
        var kosul = veri[s.kosulluAd[hedefSutun]];
        if (kosul !== undefined && kosul !== null && String(kosul).trim() !== '') {
          yazilacak[hedefSutun] = { deger: String(veri.adSoyad).trim(), alan: { tip: 'metin' } };
        }
      });
    }
    if (s.sabit) {
      Object.keys(s.sabit).forEach(function (k) { yazilacak[k] = { deger: s.sabit[k], alan: { tip: 'metin' } }; });
    }
    var simdi = new Date();
    if (s.yil) yazilacak[s.yil] = { deger: simdi.getFullYear(), alan: { tip: 'sayi' } };

    Object.keys(yazilacak).forEach(function (sutun) {
      var h = sh.getRange(satir, sutunNo_(sutun));
      var y = yazilacak[sutun];
      h.setValue(y.deger);
      if (y.alan.tip === 'tarih') h.setNumberFormat(TARIH_BICIMI);
      if (y.alan.tip === 'yuzde') h.setNumberFormat('0%');
    });

    // Veri giriş tarihi: sabit değer (TODAY() formülünün yerine)
    var tarihHucre = sh.getRange(satir, sutunNo_(s.tarihSutun));
    tarihHucre.setValue(simdi).setNumberFormat(TARIH_BICIMI);
    var eposta = '';
    try { eposta = Session.getActiveUser().getEmail(); } catch (e) { /* yoksay */ }
    tarihHucre.setNote('Form ile girildi: ' + Utilities.formatDate(simdi, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm') +
      (eposta ? '\n' + eposta : ''));

    SpreadsheetApp.flush();
    return { durum: 'tamam', sayfa: s.sayfa, satir: satir };
  } finally {
    kilit.releaseLock();
  }
}

/**
 * Verilen ada ait kayıtları listeler ("Girdiğim kayıtlar" sekmesi).
 */
function kayitlarim(adSoyad) {
  var aranan = normalize_(adSoyad);
  if (!aranan) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var sonuc = [];
  SEMA.forEach(function (s) {
    var sh = ss.getSheetByName(s.sayfa);
    if (!sh) return;
    var aralik = tabloAraligi_(ss, sh, s);
    var ilk = aralik.getRow();
    var adet = aralik.getNumRows();
    var adSutunlari = s.alanlar.filter(function (a) { return a.tip === 'ad' && a.sutun; }).map(function (a) { return a.sutun; });
    if (s.kosulluAd) adSutunlari = adSutunlari.concat(Object.keys(s.kosulluAd));
    var ozetSutunlari = s.ozet || [s.tekrar || s.alanlar.filter(function (a) { return a.sutun && a.tip !== 'ad' && a.tip !== 'bolum'; })[0].sutun];
    var sonSutun = sutunNo_(s.tarihSutun); // "Veri Giriş Tarihi" her tabloda en sağdaki sütundur
    var veriler = sh.getRange(ilk, 1, adet, sonSutun).getDisplayValues();
    veriler.forEach(function (r, i) {
      var eslesti = adSutunlari.some(function (c) { return normalize_(r[sutunNo_(c) - 1]).indexOf(aranan) !== -1; });
      if (eslesti) {
        sonuc.push({
          kategori: s.baslik, simge: s.simge, satir: ilk + i, sayfa: s.sayfa,
          ozet: ozetSutunlari.map(function (c) {
            var v = r[sutunNo_(c) - 1];
            return v && s.ozetEtiket ? s.ozetEtiket[c] + ': ' + v : v;
          }).filter(String).join(' · '),
          tarih: r[sutunNo_(s.tarihSutun) - 1]
        });
      }
    });
  });
  return sonuc;
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function semaBul_(anahtar) {
  for (var i = 0; i < SEMA.length; i++) if (SEMA[i].anahtar === anahtar) return SEMA[i];
  throw new Error('Bilinmeyen kategori: ' + anahtar);
}

function dogrula_(s, veri) {
  s.alanlar.forEach(function (a) {
    if (a.goster && veri[a.goster.sutun] !== a.goster.deger) return;
    var k = a.sutun || a.anahtar;
    var v = veri[k];
    if (a.zorunlu && (v === undefined || v === null || String(v).trim() === '')) {
      throw new Error('"' + a.etiket + '" alanı zorunludur.');
    }
    if (a.tip === 'liste' && v && a.secenekler.indexOf(v) === -1) {
      throw new Error('"' + a.etiket + '" için geçersiz seçim: ' + v);
    }
    if (a.tip === 'bolum' && v && BOLUMLER.indexOf(v) === -1) {
      throw new Error('Geçersiz bölüm: ' + v);
    }
  });
  if (s.enAzBiri) {
    var dolu = s.enAzBiri.some(function (c) { return veri[c] !== undefined && String(veri[c]).trim() !== ''; });
    if (!dolu) throw new Error('En az bir sayı alanını doldurunuz.');
  }
}

function degerDonustur_(alan, v) {
  if (v === undefined || v === null) return '';
  v = String(v).trim();
  if (v === '') return '';
  switch (alan.tip) {
    case 'tarih': {
      var p = v.split('-'); // yyyy-mm-dd
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    case 'sayi': {
      var n = Number(v.replace(',', '.'));
      return isNaN(n) ? v : n;
    }
    case 'yuzde':
      return Number(v) / 100;
    case 'metin': {
      // Impact factor gibi sayısal girişleri sayı olarak sakla
      if (/^\d+([.,]\d+)?$/.test(v)) return Number(v.replace(',', '.'));
      return v;
    }
    default:
      return v;
  }
}

function girdiSutunlari_(s) {
  var c = s.alanlar.filter(function (a) { return a.sutun; }).map(function (a) { return a.sutun; });
  if (s.kosulluAd) c = c.concat(Object.keys(s.kosulluAd));
  return c;
}

function ilkBosSatir_(sh, ilk, son, sutunlar) {
  var nolar = sutunlar.map(sutunNo_);
  var minS = Math.min.apply(null, nolar), maxS = Math.max.apply(null, nolar);
  var v = sh.getRange(ilk, minS, son - ilk + 1, maxS - minS + 1).getValues();
  for (var i = 0; i < v.length; i++) {
    var bos = nolar.every(function (n) { return v[i][n - minS] === '' || v[i][n - minS] === null; });
    if (bos) return ilk + i;
  }
  return -1;
}

/**
 * Tablo sınırlarını adlandırılmış aralıkta tutar; böylece satır eklendikçe
 * (form ya da elle) sınırlar kendiliğinden güncellenir.
 */
function tabloAraligi_(ss, sh, s) {
  var ad = aralikAdi_(s);
  var r = ss.getRangeByName(ad);
  if (!r) {
    r = sh.getRange(s.ilk, 1, s.son - s.ilk + 1, 1);
    ss.setNamedRange(ad, r);
  }
  return r;
}

function aralikAdi_(s) { return 'BAK_' + s.anahtar; }

function sutunNo_(harf) {
  var n = 0;
  for (var i = 0; i < harf.length; i++) n = n * 26 + (harf.charCodeAt(i) - 64);
  return n;
}

function normalize_(v) {
  return String(v === undefined || v === null ? '' : v).toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

/**
 * Betik E-Tabloya bağlı değilse (bağımsız proje), tablonun kimliğini
 * Proje Ayarları → Komut dosyası özellikleri → TABLO_ID olarak giriniz.
 */
function tabloKimligi_() {
  var id = PropertiesService.getScriptProperties().getProperty('TABLO_ID');
  if (!id) throw new Error('E-Tablo bulunamadı. Betiği E-Tablo içinden (Uzantılar → Apps Script) oluşturunuz.');
  return id;
}
