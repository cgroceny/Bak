// YÖK Akademik: bölüm kadrosunun herkese açık profillerini tarayıcıyla açar, Yayınlar → MAKALE /
// BİLDİRİ / KİTAP sekmelerini sayfa sayfa gezer ve sayfanın gösterdiği kayıtları JSON olarak kaydeder.
// Kullanım: node yok_topla.js yok_bolum.json yok_veri.json   (yok_bolum.json: [{authorGuidId, personelAdiSoyadi, ...}])
// For each department member: open the public profile, open Yayınlar → BİLDİRİ / KİTAP tabs,
// page through while 2025+ items are shown, and keep what the page loads.
const {chromium}=require('playwright');
const fs=require('fs');
const kisiler=JSON.parse(fs.readFileSync(process.argv[2]||'yok_bolum.json','utf8'));
const SEKMELER=['MAKALE','BİLDİRİ','KİTAP'];
const ENAZ_YIL=2025;
(async()=>{
 const px=process.env.HTTPS_PROXY||process.env.https_proxy;
 const b=await chromium.launch(px?{proxy:{server:px}}:{});
 const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1300,height:1000},locale:'tr-TR'});
 const sonuc={};
 for(const k of kisiler){
   const p=await ctx.newPage();
   const kayit={ad:k.personelAdiSoyadi,unvan:k.kadroUnvanAdi,guid:k.authorGuidId,orcid:k.orcid,yayinlar:{}};
   let aktifSekme=null;
   p.on('response',async r=>{
     if(!/\/api\/yayin\/list/.test(r.url())||!aktifSekme) return;
     try{ const j=await r.json(); (j.data&&j.data.data||[]).forEach(x=>{ kayit.yayinlar[x.yayinId]=Object.assign({sekme:aktifSekme},x); }); }catch(e){}
   });
   try{
     for(const sekme of SEKMELER){
       aktifSekme=null;
       await p.goto('https://akademik.yok.gov.tr/academician-details?authorGuidId='+k.authorGuidId,{waitUntil:'networkidle',timeout:90000});
       await p.waitForTimeout(1200);
       await p.getByText('Yayınlar',{exact:true}).locator('visible=true').first().click();
       await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1200);
       const t=p.getByText(sekme,{exact:true}).locator('visible=true').first();
       if(!(await t.count())) continue;
       aktifSekme=sekme;
       if(sekme!=='MAKALE'){ await t.click(); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1500); }
       else { await p.reload({waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(1000);
              await p.getByText('Yayınlar',{exact:true}).locator('visible=true').first().click(); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1500); }
       for(let s=0;s<60;s++){
         const ileri=p.locator('button.p-paginator-next:not(.p-disabled)').first();
         if(!(await ileri.count())) break;
         await ileri.click(); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1200);
       }
     }
   }catch(e){ kayit.hata=e.message.slice(0,200); }
   aktifSekme=null;
   await p.close();
   const liste=Object.values(kayit.yayinlar);
   kayit.yayinlar=liste;
   sonuc[k.authorGuidId]=kayit;
   const say=s=>liste.filter(x=>x.sekme===s&&Number(x.yil)===2026).length;
   console.log(k.personelAdiSoyadi.padEnd(24),'| makale:',liste.filter(x=>x.sekme==='MAKALE').length,'bildiri:',liste.filter(x=>x.sekme==='BİLDİRİ').length,'kitap:',liste.filter(x=>x.sekme==='KİTAP').length,'| toplanan:',String(liste.length).padStart(3),'| 2026 bildiri:',say('BİLDİRİ'),'| 2026 kitap:',say('KİTAP'),kayit.hata?'| HATA '+kayit.hata:'');
   await new Promise(r=>setTimeout(r,1500));
 }
 fs.writeFileSync(process.argv[3]||'yok_veri.json',JSON.stringify(sonuc,null,1));
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
