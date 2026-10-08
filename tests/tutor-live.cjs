// Opt-in check against the real local adapter. Not part of offline npm test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const base=process.env.TUTOR_URL||'http://127.0.0.1:8832';
const out=process.env.QA_OUT_DIR||path.resolve(__dirname,'../test-results');
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext(),page=await context.newPage(),results=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));fs.mkdirSync(out,{recursive:true});
 await page.goto(base+'/#lesson/1');await page.locator('#tutorSend').waitFor();
 await page.waitForFunction(()=>document.querySelector('#tutorSend').disabled===false,{},{timeout:120000});
 const health=await (await page.request.get(base+'/api/health')).json();assert.equal(health.ready,true);
 async function answer(label,prepare){
  await page.getByRole('button',{name:'Hội thoại mới',exact:true}).click();await prepare();
  const responseWait=page.waitForResponse(response=>response.url()===base+'/api/tutor/chat'&&response.request().method()==='POST',{timeout:120000});
  const started=Date.now();await page.locator('#tutorSend').click();const response=await responseWait;
  assert.equal(response.status(),200);const data=await response.json();assert(data.answer.trim());
  assert.equal(data.lesson_id,'voa-en-1-01');assert.equal(data.model_version,health.model_version);
  await page.waitForFunction(()=>document.querySelectorAll('.tutor-message.assistant').length===1);
  assert.equal(await page.locator('.tutor-message.assistant p').innerText(),data.answer);
  results.push({label,...data,elapsed_ms:Date.now()-started});console.log('PASS real tutor: '+label);
 }
 await answer('sentence correction',()=>page.locator('#tutorQuestion').fill('Sửa câu: She go to school every day.'));
 await answer('lesson vocabulary shortcut',()=>page.getByRole('button',{name:'Hỏi về từ đã chọn',exact:true}).click());
 await answer('lesson grammar shortcut',()=>page.getByRole('button',{name:'Giải thích mẫu câu',exact:true}).click());
 await answer('writing feedback shortcut',async()=>{
  await page.locator('#practiceDraft').fill('Hello. My name is Anna. I am a new student.');
  await page.getByRole('button',{name:'Nhờ nhận xét bản nháp',exact:true}).click();
 });
 await answer('conversation shortcut',()=>page.getByRole('button',{name:'Luyện hội thoại',exact:true}).click());
 const history=Array.from({length:6},(_,index)=>({role:index%2?'assistant':'user',content:'Today I am practicing English. '.repeat(50)}));
 const response=await page.request.post(base+'/api/tutor/chat',{headers:{origin:base},data:{lesson_id:'voa-en-1-01',question:'Sửa câu: She go to school.',history},timeout:120000});
 assert.equal(response.status(),200);const trimmed=await response.json();assert.equal(trimmed.history_trimmed,true);
 assert(trimmed.history_turns_used<3);assert(trimmed.answer.trim());
 results.push({label:'real tokenizer trims long history',...trimmed});console.log('PASS real tutor: long context');
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.includes('tutor'))),false);
 for(const width of [375,1440]){
  await page.setViewportSize({width,height:1000});await page.locator('#tutor').scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#tutor').screenshot({path:path.join(out,'tutor-live-'+width+'.png')});
 }
 fs.writeFileSync(path.join(out,'tutor-live-results.json'),JSON.stringify({health,passed:results.length,results,scope:'Real local model and tokenizer via Edge/API. Responses require human quality review; microphone/ASR/TTS not exercised.'},null,2));
 await context.close();await browser.close();browser=null;
})().catch(async error=>{console.error(error.stack);if(browser)await browser.close();process.exitCode=1;});
