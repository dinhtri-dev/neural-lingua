const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8831';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext(),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.micStopped=false;window.spoken=[];window.speechStopped=false;
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>{window.micStopped=true;}}]})}});
  window.MediaRecorder=class extends EventTarget{
   static isTypeSupported(){return true;}
   constructor(){super();this.state='inactive';this.mimeType='audio/webm';}
   start(){this.state='recording';}
   stop(){this.state='inactive';const e=new Event('dataavailable');Object.defineProperty(e,'data',{value:new Blob(['fake audio'])});this.dispatchEvent(e);queueMicrotask(()=>this.dispatchEvent(new Event('stop')));}
  };
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US'}],speak:u=>window.spoken.push({text:u.text,lang:u.lang}),cancel:()=>{window.speechStopped=true;}}});
 });
 let calls=[],delay=false;
 let healthState='offline',healthCalls=0;
 await page.route('**/api/health',r=>{healthCalls++;return healthState==='offline'?r.abort('failed'):r.fulfill({json:{ready:healthState==='ready',experimental:true,status:healthState}});});
 await page.route('**/api/tutor/asr',r=>r.fulfill({json:{transcript:'Hello, I am Anna.',pronunciation_assessed:false}}));
 await page.route('**/api/tutor/chat',async r=>{calls.push(r.request().postDataJSON());if(delay)await new Promise(resolve=>setTimeout(resolve,300));await r.fulfill({json:{answer:'<img src=x onerror="window.tutorXSS=1"> Câu đúng: She goes to school.',experimental:true}}).catch(()=>{});});
 await page.goto(base+'/#lesson/1');await page.locator('#tutorSend').waitFor();await page.getByRole('button',{name:'Kiểm tra kết nối lại',exact:true}).waitFor();
 assert.equal(await page.locator('#tutorSend').isEnabled(),false);
 await page.getByRole('button',{name:'Nghe tiếng Anh',exact:true}).click();
 assert.match(await page.locator('#tutorHealth').innerText(),/Chưa kết nối/);
 healthState='ready';await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled,{timeout:15000});
 assert(healthCalls>=2);assert.equal(await page.getByRole('button',{name:'Ghi âm tiếng Anh',exact:true}).isEnabled(),true);
 healthState='offline';await page.waitForFunction(()=>document.querySelector('#tutorSend').disabled,{timeout:15000});
 await page.getByRole('button',{name:'Kiểm tra kết nối lại',exact:true}).waitFor();
 healthState='ready';await page.getByRole('button',{name:'Kiểm tra kết nối lại',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
 await page.locator('#tutorQuestion').fill('She go to school.');await page.locator('#tutorSend').click();await page.locator('.tutor-message.assistant').waitFor();
 assert.equal(calls[0].lesson_id,'voa-en-1-01');assert.equal(calls[0].history.length,0);assert.equal(await page.locator('#tutor img').count(),0);assert.equal(await page.evaluate(()=>window.tutorXSS),undefined);
 await page.locator('#tutorQuestion').fill('Explain this.');await page.locator('#tutorSend').click();await page.waitForFunction(()=>document.querySelectorAll('.tutor-message.assistant').length===2);
 assert.equal(calls[1].history.length,2);
 await page.getByRole('button',{name:'Hội thoại mới',exact:true}).click();assert.equal(await page.locator('.tutor-message').count(),0);
 const before=calls.length;await page.getByRole('button',{name:'Ghi âm tiếng Anh',exact:true}).click();await page.getByRole('button',{name:'Dừng ghi âm',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#tutorQuestion').value==='Hello, I am Anna.');assert.equal(calls.length,before);assert(await page.evaluate(()=>window.micStopped));
 await page.locator('#tutorListenText').fill('Hello, I am Anna.');await page.getByRole('button',{name:'Nghe tiếng Anh',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.spoken.at(-1)),{text:'Hello, I am Anna.',lang:'en-US'});
 await page.getByRole('button',{name:'Dừng đọc',exact:true}).click();assert(await page.evaluate(()=>window.speechStopped));
 delay=true;await page.locator('#tutorQuestion').fill('Late result');await page.locator('#tutorSend').click();await page.evaluate(()=>location.hash='lesson/2');await page.locator('#tutorQuestion').waitFor();await page.waitForTimeout(400);assert.equal(await page.locator('.tutor-message').count(),0);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('tutor'))),false);
 const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});await page.setViewportSize({width:375,height:812});await page.locator('#tutor').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'tutor-mobile.png')});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 await context.close();await browser.close();console.log('PASS tutor: context, history, reset, XSS, stale result, privacy, mobile.');
})().catch(e=>{console.error(e.stack);process.exit(1);});
