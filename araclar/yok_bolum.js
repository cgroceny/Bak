// YÖK Akademik: bölümün herkese açık akademisyen listesini tarayıcıyla açar, görünen kişileri (ad, profil kimliği, ORCID) yok_bolum.json olarak kaydeder.
// Kullanım: node yok_bolum.js   → ardından: node yok_topla.js yok_bolum.json yok_veri.json → python3 yok_veri_uret.py yok_veri.json ../apps-script/Kod.gs ../apps-script/YokVeri.gs
// Open the department's public academic list and record the people shown (name + profile id).
const {chromium}=require('playwright');
const fs=require('fs');
const URL='https://akademik.yok.gov.tr/search-results?category=academics&filters=%7B%22univId%22%3A%7B%22value%22%3A%22T0W7j7jnmN3ysm4QxqK7ag%22%2C%22matchMode%22%3A%22equals%22%2C%22displayValue%22%3A%22%C4%B0ZM%C4%B0R+KAT%C4%B0P+%C3%87ELEB%C4%B0+%C3%9CN%C4%B0VERS%C4%B0TES%C4%B0%22%7D%2C%22facultyId%22%3A%7B%22value%22%3A%22g0ceeVOJq9um3tMYPoZzAg%22%2C%22matchMode%22%3A%22equals%22%2C%22displayValue%22%3A%22M%C3%9CHEND%C4%B0SL%C4%B0K+VE+M%C4%B0MARLIK+FAK%C3%9CLTES%C4%B0%22%7D%2C%22departmentId%22%3A%7B%22value%22%3A%228VItp0Iru46mGOuTc8QUqg%22%2C%22matchMode%22%3A%22equals%22%2C%22displayValue%22%3A%22ELEKTR%C4%B0K-ELEKTRON%C4%B0K+M%C3%9CHEND%C4%B0SL%C4%B0%C4%9E%C4%B0+B%C3%96L%C3%9CM%C3%9C%22%7D%7D';
(async()=>{
 const px=process.env.HTTPS_PROXY||process.env.https_proxy;
 const b=await chromium.launch(px?{proxy:{server:px}}:{});
 const p=await (await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1300,height:1000},locale:'tr-TR'})).newPage();
 const kisiler={};
 p.on('response',async r=>{
   if(!/\/api\/akademisyen\/list/.test(r.url())) return;
   try{ const j=await r.json(); const liste=(j.data&&(j.data.data||j.data))||[]; liste.forEach(x=>{ kisiler[x.authorGuidId||x.guid||JSON.stringify(x).slice(0,40)]=x; }); console.log('liste yanıtı:',r.status(),liste.length,'kişi'); }catch(e){ console.log('json değil', r.status()); }
 });
 await p.goto(URL,{waitUntil:'networkidle',timeout:90000}).catch(e=>console.log('goto:',e.message));
 await p.waitForTimeout(4000);
 // sonraki sayfalar (varsa)
 for(let i=0;i<5;i++){
   const ileri=p.locator('button.p-paginator-next:not(.p-disabled)').first();
   if(!(await ileri.count())) break;
   await ileri.click(); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(2500);
 }
 const arr=Object.values(kisiler);
 console.log('toplam:',arr.length);
 if(arr[0]) console.log('alanlar:',Object.keys(arr[0]).join(','));
 arr.forEach(x=>console.log(' ',x.authorGuidId||x.guid,'|',x.unvan||x.title||'','|',x.adSoyad||x.ad||x.name||'',x.soyad||''));
 fs.writeFileSync('yok_bolum.json',JSON.stringify(arr,null,1));
 if(!arr.length){ const t=(await p.evaluate(()=>document.body.innerText)).slice(0,1500); console.log(t); }
 await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
