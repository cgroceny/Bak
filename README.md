# BAK 2026 Çıktı Künye – Veri Giriş Formu

Öğretim üyelerinin `XXXX_BAK_2026_CiktiKunye.xlsx` tablosuna **form üzerinden** veri girmesini sağlayan Google Apps Script uygulaması.

- Öğretim üyesi bir **bağlantıya tıklar**, kategori seçer (Yayın, Proje, Patent, Ödül…), formu doldurur, **Kaydet**'e basar.
- Kayıt, ilgili sayfadaki **ilk boş satıra** yazılır. Hücrelerin yerini bilmesine, sağa kaydırmasına, örnek satırları korumasına gerek kalmaz.
- Açılır listeler Excel'deki listelerle aynıdır. Zorunlu alanlar ve tarih tutarlılığı kontrol edilir.
- **Veri Giriş Tarihi** sabit tarih olarak yazılır. Excel'deki `TODAY()` formülü her gün değiştiği için asıl giriş tarihini tutmuyordu. Hücre notuna girenin e-postası da eklenir.
- **Projeler** sayfasındaki "Yıl" sütunu ve **Patent** sayfasındaki "MMF" otomatik doldurulur.
- Aynı başlık daha önce girildiyse **mükerrer kayıt uyarısı** verir.
- Tablo dolarsa altına **otomatik satır ekler** (biçim ve açılır listeler kopyalanır).
- **Elektrik-Elektronik Müh. kadrosu** listeden adını seçer; ad ve bölüm her forma otomatik gelir. Listede olmayanlar "Listede yokum" seçip adını ve bölümünü yazar. Seçim tarayıcıda hatırlanır.
- Kadro listesi `Kod.gs` içindeki `KADRO` sabitindedir (kaynak: eee.ikcu.edu.tr akademik personel sayfası). Kadro değişince bu listeyi güncelleyin.
- **Girdiğim Kayıtlar** sekmesinde öğretim üyesi kendi kayıtlarını görür.
- Telefon ekranında da çalışır.
- **Yayınları otomatik getirme** (Bilimsel Yayın formu):
  - *Yayınlarımı getir*: öğretim üyesinin İKÇÜ adresli yayınlarını açık akademik veritabanı [OpenAlex](https://openalex.org)'ten seçilen yıl için getirir. Bulunamazsa ORCID ile aranabilir.
  - *Google Scholar'dan aktar*: Scholar profilinde yayınlar seçilip **Dışa aktar → BibTeX** metni yapıştırılır. Kayıtlar mümkünse OpenAlex'le eşleştirilip DOI, dil ve atıf bilgisi eklenir.
  - Her iki yolda da APA künye, tür, dil, yayım yeri, İKÇÜ'lü ortak yazarlar ve atıf sayısı otomatik doldurulur. Tabloda zaten olan yayınlar işaretlenir. İndeks ve Q grubu veritabanlarında bulunmadığı için listeden seçilir. Kullanıcı kontrol edip seçtiklerini tek tuşla kaydeder.
  - Google Scholar'ın resmi API'si olmadığı ve otomatik okunması Scholar kurallarına aykırı olduğu için profil sayfası doğrudan çekilmez.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `apps-script/Kod.gs` | Sunucu kodu: sayfa şeması, kayıt, mükerrer kontrolü, menü |
| `apps-script/Yayin.gs` | Yayın içe aktarma: OpenAlex sorgusu, Scholar BibTeX çözücü, APA künye |
| `apps-script/Form.html` | Form arayüzü |

## Kurulum (yaklaşık 10 dakika, bir kez)

1. **Excel'i Google E-Tablolar'a çevirin.**
   Google Drive → *Yeni → Dosya yükle* → `XXXX_BAK_2026_CiktiKunye.xlsx`.
   Dosyayı açın → *Dosya → Google E-Tablolar olarak kaydet*. Bundan sonra bu yeni kopyayla çalışın.
   > Sayfa adlarını (`Bilimsel yayın`, `Projeler`, …) ve sütun düzenini değiştirmeyin; form bunlara göre yazar.

2. **Betiği ekleyin.**
   E-Tabloda *Uzantılar → Apps Script*.
   - Varsayılan `Kod.gs` dosyasının içeriğini silin, `apps-script/Kod.gs` içeriğini yapıştırın. **+ → Komut dosyası** ile `Yayin` adında bir dosya ekleyip `apps-script/Yayin.gs` içeriğini yapıştırın.
   - Sol menüde **+ → HTML** ile `Form` adında bir dosya oluşturun (uzantısız yazın, `Form.html` olur) ve `apps-script/Form.html` içeriğini yapıştırın.
   - 💾 Kaydedin.

3. **İlk deneme (yetki verme).**
   E-Tabloyu yenileyin. Menüde **📋 BAK Veri Girişi → Veri giriş formunu aç** görünür. İlk çalıştırmada Google yetki ister: *İzin ver*.
   ("Google bu uygulamayı doğrulamadı" uyarısı çıkarsa: *Gelişmiş → … sayfasına git (güvenli değil)*. Betik sizin kendi betiğiniz olduğu için bu normaldir.)

4. **Öğretim üyelerine bağlantı olarak yayınlayın.**
   Apps Script düzenleyicisinde *Dağıt → Yeni dağıtım → ⚙ → Web uygulaması*:
   - **Şu kullanıcı olarak yürüt:** *Ben*
   - **Erişimi olanlar:** *Herkes* (girişsiz; şu anki kurulum). Alternatif: *Google hesabı olan herkes* veya Workspace hesabıyla *ikc.edu.tr içindeki herkes*.
   - *Dağıt* → çıkan **Web uygulaması URL**'sini öğretim üyeleriyle paylaşın.

   Bu ayarla öğretim üyelerinin **E-Tabloya erişimi olmasına gerek yoktur**. Tabloyu yalnızca siz görür ve düzenlersiniz. Bağlantıyı sonradan görmek için: E-Tablo menüsü → *Web uygulaması bağlantısını göster*.

5. **(İsteğe bağlı) Tabloyu koruyun.**
   Öğretim üyeleri yalnızca formu kullanacaksa E-Tabloyu onlarla paylaşmanıza gerek yok. Paylaşacaksanız *Veri → Sayfaları ve aralıkları koru* ile düzenlemeyi sınırlayabilirsiniz.

## Kod güncellendiğinde

`Kod.gs` / `Form.html` değişirse yeni içeriği yapıştırın, ardından *Dağıt → Dağıtımları yönet → ✏ → Sürüm: Yeni sürüm → Dağıt*. Bağlantı aynı kalır.

## Sonunda Excel olarak almak

*Dosya → İndir → Microsoft Excel (.xlsx)*. Sayfa yapısı orijinal şablonla aynıdır.

## Özelleştirme

Tüm sayfa/sütun tanımları `Kod.gs` içindeki `SEMA` dizisindedir:

- `sayfa`: sayfa adı; `ilk`/`son`: veri satırları (örnek satır hariç)
- `alanlar`: form alanları (`sutun`, `etiket`, `tip`, `zorunlu`, `secenekler`, `ipucu`, `ornek`)
- Bölüm listesi: `BOLUMLER`

Örneğin yeni bir proje türü eklemek için `Projeler` tanımındaki `secenekler` listesine ekleyin. E-Tablodaki açılır listeyi de (*Veri → Veri doğrulama*) aynı şekilde güncelleyin.

## Rapor dönemi

`Kod.gs` içindeki `RAPOR` sabiti dönemi belirler: yıl 2026, dönem 01.01–31.12.2026, son gönderim 04.12.2026. Form başlığında kalan gün sayısını gösterir. Patent başvurusu, ödül ve etkinlik tarihlerinin dönem içinde olmasını, proje ve bursların 2026'yla kesişmesini denetler. Yeni yılda yalnızca bu sabiti güncelleyin.

## OpenAlex API anahtarı (önerilir)

"Yayınlarımı getir" özelliği OpenAlex'i kullanır. Apps Script, Google'ın ortak IP adreslerinden istek attığı için anahtarsız isteklerde OpenAlex sık sık "çok yoğun" (429) yanıtı verir. Ücretsiz anahtarı https://openalex.org/settings/api-key adresinden alın. Apps Script düzenleyicisinde *Proje Ayarları → Komut dosyası özellikleri → Özellik ekle* ile `OPENALEX_API_KEY` adıyla girin. Anahtar olmadan da "Google Scholar'dan aktar" yolu çalışır.

## Notlar

- Form, e-tablonun saat dilimini ilk kayıtta betikle aynı yapar (Europe/Istanbul). Aksi halde tarihler bir gün kayar.

- Form, tablo sınırlarını `BAK_yayin`, `BAK_proje` … adlı **adlandırılmış aralıklarda** tutar. Bunları silmeyin; silinirse ilk kayıtta yeniden oluşturulur.
- Aynı anda birden çok kişi kaydederse kilit mekanizması kayıtların üst üste yazılmasını önler.
- Elle girilen satırlardaki `TODAY()` formülleri olduğu gibi kalır. Form ile girilen satırlarda ise sabit tarih yazılır.
- **Editörlük ve Hakemlik** sayfasında, kitap sayısı girildiyse ad "Editörlük Yapan" sütununa, dergi sayısı girildiyse "Hakemlik Yapan" sütununa yazılır.
