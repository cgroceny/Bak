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
 * Rapor dönemi (BAK yazısı: 2026 Birim Faaliyet Raporu, 01.01–31.12.2026,
 * son gönderim 4 Aralık 2026). Yıl değişince yalnızca burayı güncelleyiniz.
 */
var RAPOR = {
  yil: 2026,
  ad: '2026 Birim Faaliyet Raporu (BFR)',
  donemBas: '2026-01-01',
  donemSon: '2026-12-31',
  sonGun: '2026-12-04'
};

/**
 * Sayfa şeması. Her kategori:
 *   sayfa      : E-Tablodaki sayfa adı (birebir)
 *   ilk, son   : Veri satırlarının ilk ve son satırı (örnek satır hariç)
 *   tarihSutun : "Veri Giriş Tarihi" sütunu (otomatik doldurulur)
 *   sabit      : Her satıra otomatik yazılan sabit değerler {sutun: değer}
 *   yil        : Bu sütuna rapor yılı otomatik yazılır
 *   tekrar     : Aynı değer varsa kullanıcıyı uyaran sütun (mükerrer kontrol)
 *   donemKesisim: [başlama, bitiş] sütunları; faaliyet rapor dönemiyle kesişmelidir
 *   alanlar    : Form alanları
 *       tip  : metin | uzunMetin | liste | tarih | sayi | yuzde | ad | bolum | tarihAraligi
 *       ad   : Kullanıcının "Ad Soyad" bilgisiyle ön doldurulur
 *       bolum: Kullanıcının bölüm bilgisiyle ön doldurulur
 *       donem: true ise tarih rapor dönemi (01.01–31.12) içinde olmalıdır
 */
var SEMA = [
  {
    anahtar: 'yayin', baslik: 'Bilimsel Yayın', simge: '📄',
    aciklama: 'Makale, bildiri, poster, kitap, kitap bölümü',
    uyari: 'Yalnızca 01.01–31.12.2026 arasında yayımlanmış çalışmalarınızı ekleyiniz (basılı ya da DOI ile çevrimiçi yayımlanmış). Kabul edilmiş ama yayımlanmamış çalışmalar eklenmez. Her yayını bir kez giriniz.',
    sayfa: 'Bilimsel yayın', ilk: 12, son: 104, tarihSutun: 'N', tekrar: 'C', iceAktar: true,
    alanlar: [
      { sutun: 'B', etiket: 'Yayın Türü', tip: 'liste', zorunlu: true,
        secenekler: ['Makale', 'Sözlü (Özet) Bildiri', 'Poster', 'Tam Bildiri', 'Kitap Bölümü', 'Kitap'],
        ipucu: 'Bildiri kitabında yalnızca özeti basılan sunumlar için "Sözlü (Özet) Bildiri" seçiniz.' },
      { sutun: 'C', etiket: 'Yayın Künyesi (APA 7 formatında)', tip: 'uzunMetin', zorunlu: true,
        ipucu: 'Tüm yazarlar, (yıl), başlık, dergi/kitap adı, cilt(sayı), sayfa ve varsa DOI.',
        ornek: 'Cao, X., Kose, C., Selby, C. P., & Sancar, A. (2024). In vitro DNA repair genomics using XR-seq ... PNAS, 120(43), e2314233120. https://doi.org/...' },
      { sutun: 'D', etiket: 'Yayın Dili', tip: 'liste', zorunlu: true, secenekler: ['Türkçe', 'İngilizce', 'Almanca', 'Diğer'] },
      { sutun: 'E', etiket: 'Yayın Sahibi (bölümünüzdeki öğretim elemanı)', tip: 'ad', zorunlu: true },
      { sutun: 'F', etiket: 'Yayım Alanı', tip: 'liste', zorunlu: true, secenekler: ULUSAL,
        ipucu: 'Dergi/etkinlik uluslararası yayın kurulu ve indeksiyle yayın yapıyorsa "Uluslararası", Türkiye’de ulusal ölçekte yayın yapıyorsa "Ulusal".' },
      { sutun: 'G', etiket: 'Yayım Yeri (dergi/kitap/etkinlik adı, cilt, sayı, sayfa)', tip: 'metin',
        ornek: 'Proceedings of the National Academy of Sciences, 120(43), e2314233120.' },
      { sutun: 'H', etiket: 'İndeks', tip: 'liste', secenekler: ['SCI', 'SSCI', 'SCIE', 'AHCI', 'ESCI', 'TR Dizin', 'Diğer'],
        ipucu: 'Derginin taranma durumu (Web of Science Master Journal List / TR Dizin). Taranmıyorsa "Diğer".' },
      { sutun: 'I', etiket: 'Bağlı Olduğunuz Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'J', etiket: 'MMF’den Ortak Yazarlar', tip: 'uzunMetin',
        ipucu: 'Mühendislik ve Mimarlık Fakültesi’nden diğer yazarlar. Yoksa boş bırakınız. Aynı yayını ortak yazarınız ayrıca girmesin.', ornek: 'Kaya, A.; Akdağ, İ.' },
      { sutun: 'K', etiket: 'Dergi Etki Faktörü (5 yıllık JIF)', tip: 'metin', ipucu: 'Clarivate JCR’deki 5 yıllık etki faktörü. Yoksa "yok" yazınız.', ornek: '3.25' },
      { sutun: 'L', etiket: 'Q Grubu (JCR)', tip: 'liste', secenekler: ['Q1', 'Q2', 'Q3', 'Q4', 'Yok'],
        ipucu: 'Derginin JCR çeyrek dilimi. SCI/SCIE/SSCI dışı dergiler için "Yok".' },
      { sutun: 'M', etiket: 'Toplam Atıf Sayısı', tip: 'sayi', ornek: '0', ipucu: 'Yayının bugüne kadar aldığı atıf (Web of Science, Scopus ya da Google Scholar).' }
    ]
  },
  {
    anahtar: 'proje', baslik: 'Bilimsel Araştırma Projesi', simge: '🔬',
    aciklama: '2026’da yürütücüsü olduğunuz projeler',
    uyari: '2026 içinde yürütücüsü olduğunuz devam eden veya tamamlanan projeleri ekleyiniz. Araştırmacı olduğunuz projeleri yürütücüsü girer.',
    sayfa: 'Projeler', ilk: 10, son: 154, tarihSutun: 'R', yil: 'D', tekrar: 'F', donemKesisim: ['L', 'M'],
    alanlar: [
      { sutun: 'E', etiket: 'Proje Türü / Destek Programı', tip: 'liste', zorunlu: true,
        secenekler: ['BAP TEZ', 'BAP', 'GAP', 'COST', 'İZKA', 'KOSGEB', 'TÜSEB', 'TÜBİTAK 1001', 'TÜBİTAK 1002',
          'TÜBİTAK 1003', 'TÜBİTAK 1004', 'TÜBİTAK 1005', 'TÜBİTAK 1007', 'TÜBİTAK 2209', 'TÜBİTAK 2218',
          'TÜBİTAK 2219', 'TÜBİTAK 3001', 'TÜBİTAK 3005', 'TÜBİTAK 3501', 'DİĞER'],
        ipucu: 'Listede olmayan programlar (AB Ufuk Avrupa, sanayi projesi vb.) için "DİĞER" seçip program adını proje adının sonuna parantez içinde yazınız.' },
      { sutun: 'F', etiket: 'Proje Adı', tip: 'uzunMetin', zorunlu: true },
      { sutun: 'G', etiket: 'Proje Yürütücüsü', tip: 'ad', zorunlu: true },
      { sutun: 'K', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Tamamlanma Durumu', tip: 'yuzde', zorunlu: true, ipucu: '31.12.2026 itibarıyla tahmini ilerleme. Tamamlanan proje için %100.' },
      { sutun: 'H', etiket: 'Proje Bütçesi (TL)', tip: 'sayi', ornek: '50000', ipucu: 'Onaylanan toplam bütçe.' },
      { sutun: 'I', etiket: 'Harcanan (TL)', tip: 'sayi', ornek: '25000', ipucu: 'Başlangıçtan bugüne harcanan toplam tutar.' },
      { sutun: 'J', etiket: 'Proje Süresi (Ay)', tip: 'sayi', ornek: '24' },
      { sutun: 'L', etiket: 'Proje Başlama Tarihi', tip: 'tarih' },
      { sutun: 'M', etiket: 'Proje Bitiş Tarihi', tip: 'tarih', ipucu: 'Devam eden projede planlanan bitiş tarihi.' },
      { sutun: 'N', etiket: 'Araştırmacılar', tip: 'uzunMetin', ipucu: 'Projedeki diğer öğretim elemanları, her isim ayrı satıra.' },
      { sutun: 'O', etiket: 'TTO / Teknokent Projesi mi?', tip: 'liste', secenekler: EVET_HAYIR },
      { sutun: 'P', etiket: 'Uluslararası İşbirliği Var mı?', tip: 'liste', secenekler: EVET_HAYIR },
      { sutun: 'Q', etiket: 'Uluslararası Fon Oranı', tip: 'yuzde', ipucu: 'Bütçenin yurt dışı kaynaklı kısmı. Yoksa %0.' }
    ]
  },
  {
    anahtar: 'toplanti', baslik: 'Bilimsel Toplantı / Etkinlik', simge: '🎤',
    aciklama: 'Bölümün düzenlediği kongre, konferans, seminer, gezi vb.',
    uyari: 'Bölümünüzün düzenlediği ya da düzenlemesinde yer aldığı, 2026 içinde yapılmış etkinlikleri ekleyiniz. Katılımcı veya konuşmacı olduğunuz etkinlikler buraya girilmez.',
    sayfa: 'Bilimsel toplanti ve Faaliyet', ilk: 9, son: 44, tarihSutun: 'I', tekrar: 'F',
    alanlar: [
      { sutun: 'C', etiket: 'Düzenleyen Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'D', etiket: 'Etkinlik Türü', tip: 'liste', zorunlu: true,
        secenekler: ['Sempozyum/Kongre', 'Konferans', 'Panel', 'Eğitim Semineri', 'Diğer Seminerler', 'Açık oturum',
          'Söyleşi', 'Tiyatro', 'Konser', 'Sergi', 'Turnuva', 'Teknik gezi'] },
      { sutun: 'E', etiket: 'Kapsamı', tip: 'liste', zorunlu: true, secenekler: ['Ulusal', 'Uluslararası', 'Yerel (Üniversite içi)'] },
      { sutun: 'F', etiket: 'Etkinliğin Adı / Konusu', tip: 'metin', zorunlu: true, ornek: 'ICHE 2026' },
      { sutun: 'G', etiket: 'Yer', tip: 'metin', ornek: 'İKÇÜ Çiğli Yerleşkesi, İzmir' },
      { sutun: 'H', etiket: 'Tarih Aralığı', tip: 'tarihAraligi', zorunlu: true, donem: true, ipucu: 'Tek günlük etkinlikte yalnızca başlangıç tarihini seçiniz.' }
    ]
  },
  {
    anahtar: 'patent', baslik: 'Patent / Faydalı Model / Tasarım', simge: '💡',
    aciklama: '2026’da yapılan başvurular',
    uyari: '01.01–31.12.2026 arasında yapılan patent, faydalı model ve tasarım başvurularını ekleyiniz.',
    sayfa: 'Patent', ilk: 9, son: 25, tarihSutun: 'I', sabit: { B: 'MMF' }, tekrar: 'E',
    alanlar: [
      { sutun: 'C', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'D', etiket: 'Başvuru Sahibi (Ad Soyad)', tip: 'ad', zorunlu: true },
      { sutun: 'E', etiket: 'Buluşun Adı', tip: 'metin', zorunlu: true, ipucu: 'Faydalı model veya tasarım ise adın sonuna "(Faydalı Model)" / "(Tasarım)" ekleyiniz.' },
      { sutun: 'F', etiket: 'Başvuru Tarihi', tip: 'tarih', zorunlu: true, donem: true },
      { sutun: 'G', etiket: 'Sonuçlanma Tarihi', tip: 'tarih', ipucu: 'Henüz sonuçlanmadıysa boş bırakınız.' },
      { sutun: 'H', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Olumlu', 'Olumsuz', 'Değerlendirmede'] }
    ]
  },
  {
    anahtar: 'odul', baslik: 'Ödül', simge: '🏆',
    aciklama: 'YÖK, TÜBA, TÜBİTAK Bilim, Teşvik ve Sanat Ödülleri',
    uyari: 'Yalnızca YÖK, TÜBA ve TÜBİTAK’ın verdiği, 2026’da alınan Bilim, Teşvik ve Sanat ödüllerini ekleyiniz.',
    sayfa: 'Ödüller', ilk: 6, son: 31, tarihSutun: 'H',
    alanlar: [
      { sutun: 'B', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Ödülü Alan Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Ödül Türü', tip: 'liste', zorunlu: true, secenekler: ['Bilim Ödülü', 'Teşvik Ödülü', 'Sanat Ödülü'] },
      { sutun: 'E', etiket: 'Veren Kurum', tip: 'metin', zorunlu: true, ornek: 'TÜBİTAK' },
      { sutun: 'F', etiket: 'Veriliş Tarihi', tip: 'tarih', zorunlu: true, donem: true },
      { sutun: 'G', etiket: 'Ödülün Gerekçesi', tip: 'metin', ornek: 'Elektromanyetik alanlarda bilimsel katkı' }
    ]
  },
  {
    anahtar: 'bursTubitak', baslik: 'TÜBİTAK Araştırma Bursu', simge: '🎓',
    aciklama: 'TÜBİTAK’tan aldığınız yurt içi/yurt dışı araştırma bursu',
    uyari: '2026 içinde devam eden, tamamlanan veya iptal edilen TÜBİTAK araştırma burslarını (ör. 2219, 2218) ekleyiniz.',
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'I', ozet: ['G', 'D', 'H'], donemKesisim: ['E', 'F'],
    alanlar: [
      { sutun: 'B', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Bursu Alan Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Kapsamı', tip: 'liste', zorunlu: true, secenekler: ULUSAL, ipucu: 'Yurt dışı araştırma bursu ise "Uluslararası".' },
      { sutun: 'E', etiket: 'Başlama Tarihi', tip: 'tarih' },
      { sutun: 'F', etiket: 'Bitiş Tarihi', tip: 'tarih' },
      { sutun: 'G', etiket: 'Araştırmanın Başlığı (varsa)', tip: 'metin' },
      { sutun: 'H', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Devam eden', 'Tamamlanmış', 'İptal edilmiş'] }
    ]
  },
  {
    anahtar: 'bursArge', baslik: 'Kurum Destekli Ar-Ge Projesi', simge: '🏢',
    aciklama: 'Özel/resmi kurumların desteklediği Ar-Ge projeleri',
    uyari: 'Ulusal veya uluslararası özel ya da resmi kurumların desteklediği, 2026 içinde süren Ar-Ge projelerini ekleyiniz (TÜBİTAK/BAP projeleri "Bilimsel Araştırma Projesi" bölümüne girilir).',
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'R', ozet: ['P', 'M', 'Q'], donemKesisim: ['N', 'O'],
    alanlar: [
      { sutun: 'K', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'L', etiket: 'Yürütücü Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'M', etiket: 'Kapsamı', tip: 'liste', zorunlu: true, secenekler: ULUSAL },
      { sutun: 'N', etiket: 'Başlama Tarihi', tip: 'tarih' },
      { sutun: 'O', etiket: 'Bitiş Tarihi', tip: 'tarih' },
      { sutun: 'P', etiket: 'Projenin Başlığı ve Destekleyen Kurum', tip: 'metin', ornek: 'Akıllı şebeke izleme sistemi (X A.Ş.)' },
      { sutun: 'Q', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Devam eden', 'Tamamlanmış', 'İptal edilmiş'] }
    ]
  },
  {
    anahtar: 'editorluk', baslik: 'Editörlük ve Hakemlik', simge: '📝',
    aciklama: '2026’daki kitap editörlüğü ve dergi hakemliği sayıları',
    uyari: '2026 içinde editörlüğünü yaptığınız kitap sayısını ve hakemlik yaptığınız farklı dergi sayısını giriniz. Her öğretim elemanı bu formu bir kez doldurur.',
    sayfa: 'Editörlük ve hakemlik', ilk: 8, son: 27, tarihSutun: 'G',
    enAzBiri: ['D', 'F'], ozet: ['D', 'F'], ozetEtiket: { D: 'Editörlük (kitap)', F: 'Hakemlik (dergi)' },
    alanlar: [
      { sutun: 'B', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: null, anahtar: 'adSoyad', etiket: 'Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Editörlüğünü Yaptığınız Kitap Sayısı', tip: 'sayi', ornek: '1', ipucu: 'Editör veya bölüm editörü olduğunuz kitaplar.' },
      { sutun: 'F', etiket: 'Hakemlik Yaptığınız Dergi Sayısı', tip: 'sayi', ornek: '4', ipucu: 'Makale sayısı değil, farklı dergi sayısı.' }
    ],
    // Ad, yalnızca ilgili sayı girildiyse "Editörlük Yapan" (C) / "Hakemlik Yapan" (E) sütununa yazılır.
    kosulluAd: { C: 'D', E: 'F' }
  },
  {
    anahtar: 'egitici', baslik: 'Eğitici Eğitimi', simge: '👩‍🏫',
    aciklama: 'Aldığınız eğitici eğitimleri (yıl sınırı yok)',
    uyari: 'Öğretim becerilerine yönelik aldığınız eğitimleri ekleyiniz. Bu bölümde yıl sınırı yoktur; daha önce bildirilmemiş tüm eğitimler girilebilir.',
    sayfa: 'Eğitici Eğitimi Faaliyetleri', ilk: 5, son: 30, tarihSutun: 'I',
    alanlar: [
      { sutun: 'B', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'C', etiket: 'Eğitimi Alan Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Eğitimin Konusu', tip: 'liste', zorunlu: true,
        secenekler: ['Öğrenme Yönetim Sistemi', 'Eğitici Özellikleri', 'Eğitimde Danışmanlık', 'Dijital Öğretme Yöntemleri',
          'Program Geliştirme', 'Öğrenme-Öğretim Yöntemleri', 'Ölçme-Değerlendirme', 'İletişim Becerileri',
          'Eğitimde 21.yy Becerileri', 'Pedagojik Formasyon'] },
      { sutun: 'E', etiket: 'Eğitimin Türü', tip: 'liste', zorunlu: true, secenekler: ['Proje Eğitimi', 'Sertifika Eğitimi', 'Yüksek Lisans Eğitimi', 'Diğer'] },
      { sutun: 'F', etiket: 'Türü "Diğer" ise açıklayınız', tip: 'metin', zorunlu: true, goster: { sutun: 'E', deger: 'Diğer' } },
      { sutun: 'G', etiket: 'Veren Kurum', tip: 'metin', ornek: 'İKÇÜ Uzaktan Eğitim Merkezi' },
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
  t.semaJson = JSON.stringify({ sema: SEMA, bolumler: BOLUMLER, kadro: KADRO, rapor: RAPOR });
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
    // Tarihlerin bir gün kaymaması için tablonun saat dilimi betikle (Europe/Istanbul) aynı olmalı.
    if (ss.getSpreadsheetTimeZone() !== Session.getScriptTimeZone()) ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());

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
    if (s.yil) yazilacak[s.yil] = { deger: RAPOR.yil, alan: { tip: 'sayi' } };

    Object.keys(yazilacak).forEach(function (sutun) {
      var h = sh.getRange(satir, sutunNo_(sutun));
      var y = yazilacak[sutun];
      if (y.alan.tip === 'tarihAraligi') h.setNumberFormat('@'); // "01.02.2026" metin kalsın, tarihe çevrilmesin
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
  s.alanlar.forEach(function (a) {
    if (!a.donem || !a.sutun || (a.goster && veri[a.goster.sutun] !== a.goster.deger)) return;
    var t = ilkTarih_(veri[a.sutun]);
    if (t && (t < RAPOR.donemBas || t > RAPOR.donemSon)) {
      throw new Error('"' + a.etiket + '" rapor dönemi (' + trTarih_(RAPOR.donemBas) + '–' + trTarih_(RAPOR.donemSon) + ') içinde olmalıdır.');
    }
  });
  if (s.donemKesisim) {
    var bas = veri[s.donemKesisim[0]], bit = veri[s.donemKesisim[1]];
    if (bas && bas > RAPOR.donemSon) throw new Error('Başlama tarihi ' + trTarih_(RAPOR.donemSon) + ' sonrasında olamaz; 2026’da yürütülmemiş faaliyetler rapora girmez.');
    if (bit && bit < RAPOR.donemBas) throw new Error('Bitiş tarihi ' + trTarih_(RAPOR.donemBas) + ' öncesinde; 2026’dan önce biten faaliyetler rapora girmez.');
    if (bas && bit && bit < bas) throw new Error('Bitiş tarihi başlama tarihinden önce olamaz.');
  }
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

/** "2026-03-05" ya da "05.03.2026 – 07.03.2026" → "2026-03-05" */
function ilkTarih_(v) {
  v = String(v || '').trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) return m[0];
  m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(v);
  return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
}

function trTarih_(iso) { var p = iso.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

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
