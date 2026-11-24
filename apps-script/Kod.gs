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
 * kisa: EEE_2026_Ciktilar dosyasında kişinin sütun başlığı (7. satır).
 * Kadro değiştiğinde bu listeyi güncelleyiniz. Listede olmayanlar adını elle yazabilir.
 */
var KADRO = {
  bolum: 'Elektrik Elektronik Müh.',
  kisiler: [
    { unvan: 'Prof. Dr.', ad: 'Adnan Kaya', kisa: 'AK', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Prof. Dr.', ad: 'Merih Palandöken', kisa: 'MP', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Prof. Dr.', ad: 'Savaş Şahin', kisa: 'SŞ', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Doç. Dr.', ad: 'Kamil Çetin', kisa: 'KÇ', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Doç. Dr.', ad: 'Mehmet Erdal Özbek', kisa: 'MEÖ', abd: 'Telekomünikasyon' },
    { unvan: 'Doç. Dr.', ad: 'Volkan Kılıç', kisa: 'VK', abd: 'Devreler ve Sistemler' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Erhan Demirok', kisa: 'ED', abd: 'Elektrik Tesisleri' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Meryem Deniz', kisa: 'MD', abd: 'Elektronik' },
    { unvan: 'Dr. Öğr. Üyesi', ad: 'Saadet Simay Göztepe', kisa: 'SSY', abd: 'Telekomünikasyon' },
    { unvan: 'Öğr. Gör. Dr.', ad: 'Ferhat Bayram', kisa: 'FB', abd: 'Elektrik Makinaları' },
    { unvan: 'Arş. Gör. Dr.', ad: 'Cem Göçen', kisa: 'CG', abd: 'Elektromanyetik Alanlar ve Mikrodalga Tekniği' },
    { unvan: 'Arş. Gör. Dr.', ad: 'İsmail Akdağ', kisa: 'İA', abd: 'Devreler ve Sistemler' },
    { unvan: 'Arş. Gör. Dr.', ad: 'Mehmet Uğur Soydemir', kisa: 'MUS', abd: 'Kontrol ve Kumanda Sistemleri' },
    { unvan: 'Arş. Gör.', ad: 'Burcu Barış', kisa: 'BB', abd: 'Telekomünikasyon' },
    { unvan: 'Arş. Gör.', ad: 'Mehmet İhsan Hekimhan', kisa: 'MİH', abd: 'Elektrik Makinaları' },
    { unvan: 'Arş. Gör.', ad: 'Onur Karadal', kisa: 'OK', abd: 'Telekomünikasyon' }
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
 *   tekrar     : Mükerrer kontrolünün ana sütunu (yayında künye imzası: DOI/başlık)
 *   tekrarAnahtar: Bileşik mükerrer anahtarı [sütunlar]; hepsi eşitse kayıt aynı sayılır
 *   donemKesisim: [başlama, bitiş] sütunları; faaliyet rapor dönemiyle kesişmelidir
 *   ortakSutun : Ortak yazar/araştırmacı adlarının tutulduğu sütun (mükerrer girişte ad buraya eklenir)
 *   kisiBasinaTek: Kişi başına tek satır; tekrar kaydedilince satır güncellenir
 *   sonEk      : {sutun, alan} – alanın değeri sütundaki metnin sonuna "(…)" olarak eklenir
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
    sayfa: 'Bilimsel yayın', ilk: 12, son: 104, tarihSutun: 'N', tekrar: 'C', iceAktar: true, ortakSutun: 'J',
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
        ipucu: 'Mühendislik ve Mimarlık Fakültesi’nden diğer yazarlar, “Soyad, A.” biçiminde. Yoksa boş bırakınız. Ortak yazarınız aynı yayını girmeye çalışırsa form yeni satır açmaz, adını buraya ekler.', ornek: 'Kaya, A.; Akdağ, İ.' },
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
    sayfa: 'Projeler', ilk: 10, son: 154, tarihSutun: 'R', yil: 'D', tekrar: 'F', donemKesisim: ['L', 'M'], ortakSutun: 'N',
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
    sayfa: 'Patent', ilk: 9, son: 25, tarihSutun: 'I', sabit: { B: 'MMF' }, tekrar: 'E', tekrarAnahtar: ['D', 'E'],
    // Başvuru türü künyede ayrı sütun olmadığı için buluş adının sonuna "(Ulusal Patent)" gibi eklenir;
    // çıktı sayıları (Ulusal/Uluslararası Patent, Faydalı Model) buradan hesaplanır.
    sonEk: { sutun: 'E', alan: 'basvuruTuru' },
    alanlar: [
      { sutun: 'C', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: 'D', etiket: 'Başvuru Sahibi (Ad Soyad)', tip: 'ad', zorunlu: true },
      { sutun: null, anahtar: 'basvuruTuru', etiket: 'Başvuru Türü', tip: 'liste', zorunlu: true,
        secenekler: ['Ulusal Patent', 'Uluslararası Patent', 'Faydalı Model', 'Tasarım'] },
      { sutun: 'E', etiket: 'Buluşun Adı', tip: 'metin', zorunlu: true },
      { sutun: 'F', etiket: 'Başvuru Tarihi', tip: 'tarih', zorunlu: true, donem: true },
      { sutun: 'G', etiket: 'Sonuçlanma Tarihi', tip: 'tarih', ipucu: 'Henüz sonuçlanmadıysa boş bırakınız.' },
      { sutun: 'H', etiket: 'Durumu', tip: 'liste', zorunlu: true, secenekler: ['Olumlu', 'Olumsuz', 'Değerlendirmede'] }
    ]
  },
  {
    anahtar: 'odul', baslik: 'Ödül', simge: '🏆',
    aciklama: 'YÖK, TÜBA, TÜBİTAK Bilim, Teşvik ve Sanat Ödülleri',
    uyari: 'Yalnızca YÖK, TÜBA ve TÜBİTAK’ın verdiği, 2026’da alınan Bilim, Teşvik ve Sanat ödüllerini ekleyiniz.',
    sayfa: 'Ödüller', ilk: 6, son: 31, tarihSutun: 'H', tekrarAnahtar: ['C', 'D', 'E'],
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
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'I', ozet: ['G', 'D', 'H'], donemKesisim: ['E', 'F'], tekrarAnahtar: ['C', 'D', 'E', 'G'],
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
    sayfa: 'Burslar', ilk: 7, son: 33, tarihSutun: 'R', ozet: ['P', 'M', 'Q'], donemKesisim: ['N', 'O'], tekrarAnahtar: ['L', 'M', 'P'],
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
    uyari: '2026 içinde editörlüğünü yaptığınız kitap sayısını ve hakemlik yaptığınız farklı dergi sayısını giriniz. Yoksa 0 yazınız. Her öğretim elemanının tek satırı vardır; tekrar kaydederseniz satırınız güncellenir.',
    sayfa: 'Editörlük ve hakemlik', ilk: 8, son: 27, tarihSutun: 'G', kisiBasinaTek: true,
    ozet: ['D', 'F'], ozetEtiket: { D: 'Editörlük (kitap)', F: 'Hakemlik (dergi)' },
    alanlar: [
      { sutun: 'B', etiket: 'Bölüm', tip: 'bolum', zorunlu: true },
      { sutun: null, anahtar: 'adSoyad', etiket: 'Öğretim Elemanı', tip: 'ad', zorunlu: true },
      { sutun: 'D', etiket: 'Editörlüğünü Yaptığınız Kitap Sayısı', tip: 'sayi', zorunlu: true, ornek: '0', ipucu: 'Editör veya bölüm editörü olduğunuz kitaplar. Yoksa 0.' },
      { sutun: 'F', etiket: 'Hakemlik Yaptığınız Dergi Sayısı', tip: 'sayi', zorunlu: true, ornek: '0', ipucu: 'Makale sayısı değil, farklı dergi sayısı. Yoksa 0.' }
    ],
    // Ad, yalnızca ilgili sayı 0'dan büyükse "Editörlük Yapan" (C) / "Hakemlik Yapan" (E) sütununa yazılır.
    kosulluAd: { C: 'D', E: 'F' }
  },
  {
    anahtar: 'egitici', baslik: 'Eğitici Eğitimi', simge: '👩‍🏫',
    aciklama: 'Aldığınız eğitici eğitimleri (yıl sınırı yok)',
    uyari: 'Öğretim becerilerine yönelik aldığınız eğitimleri ekleyiniz. Bu bölümde yıl sınırı yoktur; daha önce bildirilmemiş tüm eğitimler girilebilir.',
    sayfa: 'Eğitici Eğitimi Faaliyetleri', ilk: 5, son: 30, tarihSutun: 'I', tekrarAnahtar: ['C', 'D', 'E', 'F'],
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
    .addItem('Mükerrer ve tutarlılık denetimi', 'denetimPenceresi')
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
  t.semaJson = JSON.stringify({ sema: SEMA, bolumler: BOLUMLER, kadro: KADRO, rapor: RAPOR, cikti: CIKTI.gruplar });
  return t.evaluate();
}

// ---------------------------------------------------------------------------
// Kayıt
// ---------------------------------------------------------------------------

/**
 * Formdan gelen kaydı ilgili sayfaya yazar.
 * @param {string} anahtar  Şemadaki kategori anahtarı
 * @param {Object} veri     {sutunHarfi | alanAnahtari: değer}
 * @return {Object} {durum: 'tamam'|'tekrar', sayfa, satir}
 */
function kaydet(anahtar, veri) {
  var s = semaBul_(anahtar);
  dogrula_(s, veri);
  if (s.sonEk && veri[s.sonEk.alan] && veri[s.sonEk.sutun]) {
    var ek = ' (' + veri[s.sonEk.alan] + ')';
    var metin = String(veri[s.sonEk.sutun]).trim();
    if (metin.slice(-ek.length) !== ek) veri[s.sonEk.sutun] = metin + ek;
  }

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

    var gonderen = gonderenAdi_(s, veri);

    // Mükerrer kontrolü: aynı kayıt ikinci kez girilemez. Ortak yazar / araştırmacı girmeye
    // çalışırsa yeni satır açılmaz, adı mevcut satırın ortak sütununa eklenir.
    var es = tekrarBul_(sh, s, ilk, son, veri);
    if (es) {
      var sonucT = tekrarDurumu_(s, es, gonderen);
      sonucT.sayfa = s.sayfa;
      if (sonucT.durum === 'ortakEklenebilir') {
        var h = sh.getRange(es.satir, sutunNo_(s.ortakSutun));
        var yeni = s.ortakSutun === 'J' ? apaAd_(gonderen) : gonderen;
        h.setValue(es.ortak ? String(es.ortak).replace(/[;\s]+$/, '') + (s.ortakSutun === 'J' ? '; ' : '\n') + yeni : yeni);
        SpreadsheetApp.flush();
        sonucT.durum = 'ortakEklendi';
      }
      return sonucT;
    }

    // Kişi başına tek satır (editörlük/hakemlik): varsa güncelle, sayılar 0 ise satırı boşalt
    var mevcutSatir = s.kisiBasinaTek && gonderen ? kisiSatiri_(sh, s, ilk, son, gonderen) : -1;
    if (s.kisiBasinaTek) {
      var hepsiSifir = s.alanlar.every(function (a) { return a.tip !== 'sayi' || !(Number(veri[a.sutun]) > 0); });
      if (mevcutSatir !== -1) satirTemizle_(sh, s, mevcutSatir);
      if (hepsiSifir) {
        SpreadsheetApp.flush();
        return { durum: 'sifir', sayfa: s.sayfa, satir: mevcutSatir === -1 ? null : mevcutSatir };
      }
    }

    // İlk boş satırı bul
    var satir = mevcutSatir !== -1 ? mevcutSatir : ilkBosSatir_(sh, ilk, son, girdiSutunlari);
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
      if (s.kisiBasinaTek && a.tip === 'sayi' && !(v > 0)) return; // 0 olan sayı künyeye yazılmaz
      if (v !== '') yazilacak[a.sutun] = { deger: v, alan: a };
    });
    if (s.kosulluAd) {
      Object.keys(s.kosulluAd).forEach(function (hedefSutun) {
        var kosul = veri[s.kosulluAd[hedefSutun]];
        if (Number(kosul) > 0) {
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
    return { durum: mevcutSatir !== -1 ? 'guncellendi' : 'tamam', sayfa: s.sayfa, satir: satir };
  } finally {
    kilit.releaseLock();
  }
}

/**
 * Seçilen kişinin tablodaki kayıtları (kendi girdikleri + ortak yazar/araştırmacı olarak
 * adının geçtikleri). Kişiye bağlı olmayan sayfalarda (bilimsel toplantı) bölümün tüm kayıtları döner.
 * @return {Object} { anahtar: [{satir, ozet, rol: 'sahip'|'ortak'|'bolum', giren, tarih, degerler}] }
 */
function kisiKayitlari(ad) {
  var ka = kisiAnahtar_(ad);
  if (!ka.tam) return {};
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var sonuc = {};
  SEMA.forEach(function (s) {
    sonuc[s.anahtar] = [];
    var sh = ss.getSheetByName(s.sayfa);
    if (!sh) return;
    var aralik = tabloAraligi_(ss, sh, s);
    var ilk = aralik.getRow(), adet = aralik.getNumRows();
    var veriler = sh.getRange(ilk, 1, adet, sutunNo_(s.tarihSutun)).getDisplayValues();
    var sahipSut = sahipSutunlari_(s);
    var girdi = girdiSutunlari_(s);
    var ozetSut = s.ozet || [s.tekrar || s.alanlar.filter(function (a) { return a.sutun && a.tip !== 'ad' && a.tip !== 'bolum'; })[0].sutun];
    veriler.forEach(function (r, i) {
      var hucre = function (c) { return r[sutunNo_(c) - 1]; };
      if (girdi.every(function (c) { return !hucre(c); })) return; // boş satır
      var giren = sahipSut.map(hucre).filter(Boolean)[0] || '';
      var rol = null;
      if (!sahipSut.length) rol = 'bolum';
      else if (sahipSut.some(function (c) { return katla_(hucre(c)) === ka.tam; })) rol = 'sahip';
      else if (s.ortakSutun && iliskili_(hucre(s.ortakSutun), ka)) rol = 'ortak';
      if (!rol) return;
      var kayit = {
        satir: ilk + i, rol: rol, giren: giren, tarih: hucre(s.tarihSutun),
        ozet: ozetSut.map(function (c) {
          var v = hucre(c);
          return v && s.ozetEtiket ? s.ozetEtiket[c] + ': ' + v : v;
        }).filter(String).join(' · ')
      };
      if (s.kisiBasinaTek) {
        kayit.degerler = {};
        s.alanlar.forEach(function (a) { if (a.sutun) kayit.degerler[a.sutun] = hucre(a.sutun); });
      }
      sonuc[s.anahtar].push(kayit);
    });
  });
  return sonuc;
}

/** Kişi adından karşılaştırma anahtarları: tam ad ve APA biçimi ("akdag i"). */
function kisiAnahtar_(ad) {
  var tam = katla_(ad);
  var t = tam.split(' ').filter(Boolean);
  return { tam: tam, apa: t.length > 1 ? t[t.length - 1] + ' ' + t[0].charAt(0) : tam };
}

/** Metinde (ortak yazar listesi vb.) kişinin tam adı ya da "Soyad, A." biçimi geçiyor mu? */
function iliskili_(metin, ka) {
  if (!metin || !ka.tam) return false;
  var m = ' ' + katla_(metin) + ' ';
  return m.indexOf(' ' + ka.tam + ' ') !== -1 || m.indexOf(' ' + ka.apa + ' ') !== -1;
}

function sahipSutunlari_(s) {
  var c = s.alanlar.filter(function (a) { return a.tip === 'ad' && a.sutun; }).map(function (a) { return a.sutun; });
  if (s.kosulluAd) c = c.concat(Object.keys(s.kosulluAd));
  return c;
}

function gonderenAdi_(s, veri) {
  var a = s.alanlar.filter(function (x) { return x.tip === 'ad'; })[0];
  return a ? String(veri[a.sutun || a.anahtar] || '').trim() : '';
}

/**
 * Künyeden karşılaştırma imzası: DOI ve APA künyesindeki başlık ("(2026). Başlık.").
 */
function kunyeImza_(metin) {
  metin = String(metin || '');
  var doi = (/10\.\d{4,9}\/[^\s,;]+/i.exec(metin) || [''])[0].replace(/[.)]+$/, '').toLowerCase();
  var m = /\((?:\d{4}[a-z]?|t\.y\.|n\.d\.)\)\.\s*(.+?)(?:[.?!]\s|$)/i.exec(metin);
  return { doi: doi, baslik: m ? katla_(m[1]) : '', tum: katla_(metin) };
}

/** Mükerrer anahtar sütunları. */
function anahtarSutunlari_(s) {
  return s.tekrarAnahtar || (s.tekrar ? [s.tekrar] : []);
}

/**
 * Karşılaştırma için sütun değeri: Türkçe karakter/noktalama/büyük-küçük harf farkı
 * yok sayılır, tarihler tek biçime çevrilir, patent başvuru türü eki atılır.
 */
function anahtarDeger_(s, c, v) {
  v = String(v === undefined || v === null ? '' : v).trim();
  if (s.sonEk && c === s.sonEk.sutun) v = v.replace(/\s*\([^()]*\)\s*$/, '');
  var t = ilkTarih_(v);
  if (t && /^\d{4}-\d{2}-\d{2}$|^\d{2}\.\d{2}\.\d{4}$/.test(v)) return t;
  return katla_(v).replace(/\s+/g, ''); // "T.Ü.B.A." ile "TÜBA" aynı sayılır
}

/** İki yayın künyesi aynı yayın mı? (DOI ya da başlık) */
function yayinEsit_(yeni, e) {
  return (yeni.doi && yeni.doi === e.doi) ||
    (yeni.baslik.length >= 15 && yeni.baslik === e.baslik) ||
    yeni.tum === e.tum ||
    (yeni.baslik.length >= 20 && e.tum.indexOf(yeni.baslik) !== -1) ||
    (e.baslik.length >= 20 && yeni.tum.indexOf(e.baslik) !== -1);
}

/**
 * Aynı kaydı arar (haric: kendisiyle karşılaştırılmayacak satır).
 * @return {Object|null} {satir, giren, ortak}
 */
function tekrarBul_(sh, s, ilk, son, veri, haric) {
  var kols = anahtarSutunlari_(s);
  if (!kols.length || !String(veri[kols[0]] || '').trim()) return null;
  var n = son - ilk + 1;
  var genislik = sutunNo_(s.tarihSutun);
  var v = sh.getRange(ilk, 1, n, genislik).getDisplayValues();
  var sahip = sahipSutunlari_(s)[0];
  var yayin = s.anahtar === 'yayin' ? kunyeImza_(veri[kols[0]]) : null;
  var yeni = kols.map(function (c) { return anahtarDeger_(s, c, veri[c]); });
  for (var i = 0; i < n; i++) {
    if (ilk + i === haric) continue;
    var r = v[i];
    var hucre = function (c) { return r[sutunNo_(c) - 1]; };
    if (!String(hucre(kols[0])).trim()) continue;
    var esit = yayin ? yayinEsit_(yayin, kunyeImza_(hucre(kols[0])))
      : kols.every(function (c, j) { return anahtarDeger_(s, c, hucre(c)) === yeni[j]; });
    if (esit) {
      return { satir: ilk + i, giren: sahip ? hucre(sahip) : '', ortak: s.ortakSutun ? hucre(s.ortakSutun) : '' };
    }
  }
  return null;
}

/** Bulunan mükerrer için gönderene göre durum. */
function tekrarDurumu_(s, es, gonderen) {
  var r = { durum: 'tekrar', satir: es.satir, giren: es.giren };
  if (gonderen) {
    var ka = kisiAnahtar_(gonderen);
    if (es.giren && katla_(es.giren) === ka.tam) r.durum = 'zatenSizin';
    else if (s.ortakSutun && iliskili_(es.ortak, ka)) r.durum = 'zatenOrtak';
    else if (s.ortakSutun) r.durum = 'ortakEklenebilir';
  }
  return r;
}

/**
 * Formda yazarken anlık mükerrer kontrolü (hiçbir şey yazmaz).
 * @return {Object} {durum: 'yok'|'tekrar'|'zatenSizin'|'zatenOrtak'|'ortakEklenebilir', satir, giren}
 */
function tekrarKontrol(anahtar, veri) {
  var s = semaBul_(anahtar);
  veri = JSON.parse(JSON.stringify(veri || {}));
  if (s.sonEk && veri[s.sonEk.alan] && veri[s.sonEk.sutun]) veri[s.sonEk.sutun] = String(veri[s.sonEk.sutun]).trim() + ' (' + veri[s.sonEk.alan] + ')';
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(tabloKimligi_());
  var sh = ss.getSheetByName(s.sayfa);
  if (!sh) return { durum: 'yok' };
  var ar = tabloAraligi_(ss, sh, s);
  var es = tekrarBul_(sh, s, ar.getRow(), ar.getRow() + ar.getNumRows() - 1, veri);
  if (!es) return { durum: 'yok' };
  var r = tekrarDurumu_(s, es, gonderenAdi_(s, veri));
  r.sayfa = s.sayfa;
  return r;
}

function kisiSatiri_(sh, s, ilk, son, ad) {
  var k = katla_(ad);
  var sut = sahipSutunlari_(s);
  var v = sh.getRange(ilk, 1, son - ilk + 1, Math.max.apply(null, sut.map(sutunNo_))).getDisplayValues();
  for (var i = 0; i < v.length; i++) {
    if (sut.some(function (c) { return katla_(v[i][sutunNo_(c) - 1]) === k; })) return ilk + i;
  }
  return -1;
}

function satirTemizle_(sh, s, satir) {
  girdiSutunlari_(s).concat([s.tarihSutun]).forEach(function (c) {
    var h = sh.getRange(satir, sutunNo_(c));
    h.clearContent(); h.clearNote();
  });
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
