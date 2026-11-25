"""YÖK Akademik toplama çıktısından (yok_topla.js) Apps Script için YokVeri.gs üretir.

Kullanım: python3 yok_veri_uret.py yok_veri.json ../apps-script/Kod.gs ../apps-script/YokVeri.gs [en_az_yil]
Kişiler, Kod.gs içindeki KADRO listesindeki `yok:` kimliğiyle eşleştirilir.
"""
import json, re, sys, datetime

kaynak, kod, hedef = sys.argv[1], sys.argv[2], sys.argv[3]
en_az = int(sys.argv[4]) if len(sys.argv) > 4 else 2025
veri = json.load(open(kaynak, encoding='utf-8'))
kadro = dict((g, ad) for ad, g in re.findall(r"ad: '([^']+)'[^}]*?yok: '([0-9A-F]+)'", open(kod, encoding='utf-8').read()))

ALANLAR = {'s': 'sekme', 'b': 'yayinAdi', 'y': 'yazarAdi', 'yer': 'yayinYeri', 'yil': 'yil', 'tur': 'yayinTuruAdi',
           'kapsam': 'kapsam', 'ulke': 'ulkeAdi', 'sehir': 'sehir', 'bas': 'basTarih', 'bit': 'bitTarih',
           'ilk': 'ilkSayfa', 'son': 'sonSayfa', 'cilt': 'cilt', 'sayi': 'sayi', 'doi': 'doi', 'isbn': 'isbn', 'dil': 'dilAdi'}
kisiler, toplam = {}, 0
for guid, k in veri.items():
    ad = kadro.get(guid)
    if not ad:
        print('KADRODA YOK:', guid, k.get('ad')); continue
    liste = []
    for x in k['yayinlar']:
        try:
            if int(x.get('yil') or 0) < en_az: continue
        except ValueError:
            continue
        liste.append({a: str(x[b]).strip() for a, b in ALANLAR.items() if x.get(b) not in (None, '')})
    kisiler[ad] = liste
    toplam += len(liste)
    print(f'{ad:24} {len(liste):3} kayıt (>= {en_az})')
tarih = datetime.date.today().strftime('%d.%m.%Y')
with open(hedef, 'w', encoding='utf-8') as f:
    f.write('/**\n * YÖK Akademik verisi (otomatik üretildi: araclar/yok_veri_uret.py, ' + tarih + ').\n'
            ' * Bölüm kadrosunun herkese açık YÖK Akademik profillerinde görünen ' + str(en_az) + ' ve sonrası yayınlar.\n */\n')
    f.write('var YOK_VERI = ' + json.dumps({'tarih': tarih, 'kisiler': kisiler}, ensure_ascii=False, indent=0) + ';\n')
print('toplam', toplam, 'kayıt →', hedef)
