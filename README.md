# BAK 2026 – EEE Veri Giriş Formu

Elektrik-Elektronik Mühendisliği öğretim elemanlarının 2026 Birim Faaliyet Raporu verilerini toplayan Google Apps Script web uygulaması. Veriler iki Google E-Tablo'ya yazılır:

1. **EEE_BAK_2026_CiktiKunye**: faaliyet künyeleri (BAK şablonu `XXXX_BAK_2026_CiktiKunye.xlsx`)
2. **EEE_2026_Ciktilar**: öğretim elemanı bazlı bilimsel çıktı sayıları (BAK şablonu `XXXX_2026_Ciktilar.xlsx`)

## Nasıl çalışır

- **Kimlik:** Öğretim elemanı listeden adını seçer. Kadroda olmayanlar adını elle yazar.
- **Adım adım akış:** Her kalem bir adımdır (yayın, proje, etkinlik, patent, ödül, TÜBİTAK bursu, kurum destekli Ar-Ge, editörlük/hakemlik, eğitici eğitimi, çıktı sayıları). Her adımda ya kayıt girilir ya da "Bu kalemde kaydım yok (0)" denir. Üstteki adım çubuğu durumu gösterir: ✓ girildi, 0 yok, numara yanıtlanmadı. Son adımdaki özet eksik adımları listeler.
- **Tablodaki kayıtlar:** Ad seçilince kişinin tablodaki kayıtları her adımda listelenir. Liste kendi girdiklerini ve ortak yazar/araştırmacı olarak adının geçtiklerini içerir.
- **Mükerrer engeli:** Aynı yayın (DOI ya da APA künyesindeki başlık), aynı proje adı vb. ikinci kez girilemez. Ortak yazar girmeye çalışırsa yeni satır açılmaz, adı mevcut satırın "MMF'den ortak yazarlar" (projede "Araştırmacılar") sütununa eklenir.
- **Yayınları otomatik getirme:** OpenAlex'ten tek tıkla ya da Google Scholar BibTeX ile. Tabloda zaten olan yayınlar kilitli gelir. Başkasının girdiği yayın seçilirse kişi ortak yazar olarak eklenir.
- **Çıktı sayıları:** Son adımda kişinin EEE_2026_Ciktilar sütunu gelir. Künyeden hesaplananlar önceden doldurulur: makale (WoS/ESCI/TR Dizin/Diğer), kitap, patent türü ve türü belli projeler. Diğer kalemler 0 gelir. Her kalem için sayı zorunludur, 0 dahil. Onaylanınca sütun yazılır.
- **Editörlük/hakemlik:** Kişi başına tek satırdır, tekrar kaydedilince güncellenir. 0/0 girilirse satır boşaltılır.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `apps-script/Kod.gs` | Sunucu kodu: sayfa şeması, kayıt, mükerrer kontrolü, menü |
| `apps-script/Cikti.gs` | Çıktı sayıları: kalem listesi, künyeden otomatik sayım, EEE_2026_Ciktilar'a yazma |
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

## Yerel ayarlar (Ayarlar.gs)

Depoya eklenmeyen `apps-script/Ayarlar.gs` dosyası Apps Script projesine ayrıca eklenir:

```js
var OPENALEX_API_KEY = '...';   // https://openalex.org/settings/api-key
var CIKTI_TABLO_ID = '...';     // EEE_2026_Ciktilar e-tablosunun kimliği (URL'deki /d/ ile /edit arası)
```

Aynı değerler Komut dosyası özellikleri (`OPENALEX_API_KEY`, `CIKTI_TABLO_ID`) olarak da girilebilir.

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
