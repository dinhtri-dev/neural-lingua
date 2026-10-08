// API/audio fixtures exercise UI lifecycle; this suite does not grade model quality.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8831';
const out=process.env.QA_OUT_DIR||path.resolve(__dirname,'../test-results');
const lesson=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/course.json'),'utf8')).lessons[0];
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext(),page=await context.newPage(),errors=[],results=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.micMode='normal';window.micStops=0;window.recorderStarts=0;
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>{
   const stream={getTracks:()=>[{stop:()=>window.micStops++}]};
   return window.micMode==='pending'?new Promise(resolve=>window.resolveMic=()=>resolve(stream)):Promise.resolve(stream);
  }}});
  window.MediaRecorder=class extends EventTarget{
   static isTypeSupported(){return true;}
   constructor(){super();this.state='inactive';this.mimeType='audio/webm';}
   start(){this.state='recording';window.recorderStarts++;}
   stop(){this.state='inactive';const event=new Event('dataavailable');Object.defineProperty(event,'data',{value:new Blob(['audio fixture'])});this.dispatchEvent(event);queueMicrotask(()=>this.dispatchEvent(new Event('stop')));}
  };
  Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices:()=>[]}});
 });
 let calls=[],asrCalls=0,chatMode='normal',asrMode='normal';
 await page.route('**/api/health',route=>route.fulfill({json:{ready:true,experimental:true,status:'experimental'}}));
 await page.route('**/api/tutor/chat',async route=>{
  const body=route.request().postDataJSON(),mode=chatMode;calls.push(body);
  if(mode==='slow'||mode==='slower')await new Promise(resolve=>setTimeout(resolve,mode==='slow'?400:800));
  await route.fulfill({json:{answer:mode==='empty'?'':'Câu đúng: I am a student.',experimental:true,history_turns_used:mode==='trim'?0:body.history.length/2,history_trimmed:mode==='trim'}}).catch(()=>{});
 });
 await page.route('**/api/tutor/asr',async route=>{
  asrCalls++;const mode=asrMode;
  if(mode==='slow')await new Promise(resolve=>setTimeout(resolve,400));
  await route.fulfill({json:{transcript:mode==='empty'?'':'Hello, I am Anna.',pronunciation_assessed:false}}).catch(()=>{});
 });
 await page.goto(base+'/#lesson/1');await page.locator('#tutorSend').waitFor();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
 const button=name=>page.getByRole('button',{name,exact:true});
 async function test(name,action){await action();results.push(name);console.log('PASS '+name);}
 async function reset(){await button('Hội thoại mới').click();}
 async function send(text){await page.locator('#tutorQuestion').fill(text);await page.locator('#tutorSend').click();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);}
 await test('Lesson prompts are editable and never auto-send',async()=>{
  const count=calls.length;await button('Giải thích mẫu câu').click();assert.match(await page.locator('#tutorQuestion').inputValue(),/Giải thích mẫu câu/);
  assert((await page.locator('#tutorQuestion').inputValue()).includes(lesson.grammar.example));assert.equal(calls.length,count);
  await reset();await page.locator('#tutorWord').selectOption('welcome');await button('Hỏi về từ đã chọn').click();assert.match(await page.locator('#tutorQuestion').inputValue(),/"welcome"/);
  await reset();await button('Luyện hội thoại').click();assert.match(await page.locator('#tutorQuestion').inputValue(),/Mỗi lượt chỉ hỏi một câu/);assert.equal(calls.length,count);
 });
 await test('Existing questions require explicit replacement',async()=>{
  await page.locator('#tutorQuestion').fill('My unfinished question');await button('Giải thích mẫu câu').click();
  assert.equal(await page.locator('#tutorQuestion').inputValue(),'My unfinished question');assert(await page.locator('#tutorSuggestion').isVisible());
  await button('Giữ câu đang viết').click();assert.equal(await page.locator('#tutorQuestion').inputValue(),'My unfinished question');
  await button('Giải thích mẫu câu').click();await button('Dùng gợi ý này').click();assert.match(await page.locator('#tutorQuestion').inputValue(),/Giải thích mẫu câu/);
 });
 await test('Vocabulary focus follows the accepted suggestion and clears after edits',async()=>{
  await reset();await page.locator('#tutorWord').selectOption('welcome');await button('Hỏi về từ đã chọn').click();
  await page.locator('#tutorSend').click();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
  assert.equal(calls.at(-1).focus_word,'welcome');
  await button('Hỏi về từ đã chọn').click();await page.locator('#tutorQuestion').fill('A different question');await page.locator('#tutorSend').click();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
  assert.equal(calls.at(-1).focus_word,null);
 });
 await test('Listening suggestions never splice Vietnamese prose or the original wrong sentence',async()=>{
  const result=await page.evaluate(async()=>{
   const {englishForListening}=await import('/js/tutor.js');
   return [
    englishForListening('Câu Hello chưa đúng theo mẫu. Hãy thử lại với câu đúng mẫu: I am Linh.'),
    englishForListening('She go to school every day. sửa thành She goes to school every day.'),
    englishForListening('Câu đúng: She goes to school. Chủ ngữ she cần động từ thêm s.'),
    englishForListening('hello nghĩa là xin chào. Ví dụ: Hello, my name is Anna.'),
    englishForListening('Hello, I am Anna.')
   ];
  });
  assert.deepEqual(result,['','','She goes to school.','Hello, my name is Anna.','Hello, I am Anna.']);
 });
 await test('Writing feedback preserves draft and sends only after explicit Send',async()=>{
  await reset();await button('Nhờ nhận xét bản nháp').click();assert.match(await page.locator('#tutorStatus').innerText(),/Hãy viết bản nháp/);
  const draft='Hello. My name is Anna. I am a new student.';await page.locator('#practiceDraft').fill(draft);
  const count=calls.length;await button('Nhờ nhận xét bản nháp').click();assert.equal(calls.length,count);
  assert.match(await page.locator('#tutorQuestion').inputValue(),/Giữ câu đã đúng/);assert((await page.locator('#tutorQuestion').inputValue()).includes(draft));
  await page.locator('#tutorQuestion').press('Control+Enter');await page.waitForFunction(()=>document.querySelectorAll('.tutor-message.assistant').length===1);
  assert(calls.at(-1).question.includes(draft));assert.equal(await page.locator('#practiceDraft').inputValue(),draft);
 });
 await test('Oversized writing is neither cut nor submitted',async()=>{
  await reset();await page.locator('#practiceDraft').fill('a'.repeat(2100));const count=calls.length;
  await button('Nhờ nhận xét bản nháp').click();assert.match(await page.locator('#tutorStatus').innerText(),/vượt 2.000/);
  assert.equal(await page.locator('#tutorQuestion').inputValue(),'');assert.equal((await page.locator('#practiceDraft').inputValue()).length,2100);assert.equal(calls.length,count);
 });
 await test('Context trimming is visible and discarded history stays discarded',async()=>{
  await reset();chatMode='normal';await send('First');await send('Second');chatMode='trim';await send('Third');
  assert.equal(calls.at(-1).history.length,4);assert.match(await page.locator('#tutorContext').innerText(),/dùng 0 lượt/);
  chatMode='normal';await send('Fourth');assert.equal(calls.at(-1).history.length,2);assert.equal(calls.at(-1).history[0].content,'Third');assert.equal(await page.locator('.tutor-message.assistant').count(),4);
 });
 await test('Cancel keeps the question and ignores late responses',async()=>{
  await reset();chatMode='slow';await page.locator('#tutorQuestion').fill('Keep this question');await page.locator('#tutorSend').click();
  await button('Hủy yêu cầu').click();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);await page.waitForTimeout(500);
  assert.equal(await page.locator('#tutorQuestion').inputValue(),'Keep this question');assert.equal(await page.locator('.tutor-message').count(),0);assert.match(await page.locator('#tutorStatus').innerText(),/dừng chờ/);
 });
 await test('Reset isolates an old request from a new in-flight request',async()=>{
  chatMode='slow';await page.locator('#tutorSend').click();await reset();chatMode='slower';
  await page.locator('#tutorQuestion').fill('New session question');await page.locator('#tutorSend').click();await page.waitForTimeout(500);
  assert(await page.locator('#tutorSend').isDisabled());await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
  assert.equal(await page.locator('.tutor-message.user p').innerText(),'New session question');assert.equal(calls.at(-1).history.length,0);
 });
 await test('Empty model responses preserve input for retry',async()=>{
  await reset();chatMode='empty';await send('Do not lose this');
  assert.equal(await page.locator('#tutorQuestion').inputValue(),'Do not lose this');assert.equal(await page.locator('.tutor-message').count(),0);assert.match(await page.locator('#tutorStatus').innerText(),/chưa trả lời/);chatMode='normal';
 });
 await test('Reset during microphone permission releases the late stream',async()=>{
  await reset();await page.evaluate(()=>window.micMode='pending');const count=asrCalls;
  const starts=await page.evaluate(()=>window.recorderStarts);await button('Ghi âm tiếng Anh').click();assert(await page.locator('#tutorSend').isDisabled());
  await reset();await page.evaluate(()=>{window.resolveMic();window.micMode='normal';});await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>window.recorderStarts),starts);assert((await page.evaluate(()=>window.micStops))>0);assert.equal(asrCalls,count);assert(await page.locator('#tutorSend').isEnabled());
 });
 await test('Reset while recording discards audio without starting ASR',async()=>{
  const count=asrCalls;await button('Ghi âm tiếng Anh').click();await button('Dừng ghi âm').waitFor();await reset();await page.waitForTimeout(80);
  assert.equal(asrCalls,count);assert.match(await page.locator('#tutorStatus').innerText(),/Đã bắt đầu hội thoại mới/);assert(await page.locator('#tutor audio').isHidden());
 });
 await test('Transcript never overwrites an existing question or auto-sends',async()=>{
  await page.locator('#tutorQuestion').fill('Keep my written question');const count=calls.length;
  await button('Ghi âm tiếng Anh').click();assert(await page.locator('#tutorQuestion').isDisabled());await button('Dừng ghi âm').click();
  await page.locator('#tutorSuggestion').waitFor();await page.waitForFunction(()=>!document.querySelector('#tutorSend').disabled);
  assert.equal(await page.locator('#tutorQuestion').inputValue(),'Keep my written question');assert.equal(await page.locator('#tutorSuggestion').inputValue(),'Hello, I am Anna.');assert.equal(calls.length,count);
  await button('Dùng gợi ý này').click();assert.equal(await page.locator('#tutorQuestion').inputValue(),'Hello, I am Anna.');
 });
 await test('ASR from a previous conversation cannot restore its transcript',async()=>{
  await reset();asrMode='slow';await button('Ghi âm tiếng Anh').click();await button('Dừng ghi âm').click();await button('Hủy yêu cầu').waitFor();await reset();
  await page.locator('#tutorQuestion').fill('My new draft');await page.waitForTimeout(500);assert.equal(await page.locator('#tutorQuestion').inputValue(),'My new draft');
  assert.match(await page.locator('#tutorStatus').innerText(),/Đã bắt đầu hội thoại mới/);asrMode='normal';
 });
 await test('Tutor section navigation preserves the practice draft',async()=>{
  await page.locator('#practiceDraft').fill('A draft to keep');await page.getByRole('link',{name:'Gia sư AI',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'tutor');assert.equal(await page.locator('#practiceDraft').inputValue(),'A draft to keep');
 });
 await test('Small screens fit; chats and drafts are not persisted',async()=>{
  await reset();await button('Luyện hội thoại').click();fs.mkdirSync(out,{recursive:true});
  for(const width of [320,375,1440]){
   await page.setViewportSize({width,height:900});await page.locator('#tutor').scrollIntoViewIfNeeded();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,'tutor-flow-'+width+'.png')});
  }
  assert.equal(await page.evaluate(()=>Object.values(localStorage).some(value=>value.includes('A draft to keep')||value.includes('My new draft'))),false);assert.deepEqual(errors,[]);
 });
 fs.writeFileSync(path.join(out,'tutor-flow-results.json'),JSON.stringify({passed:results.length,tests:results,scope:'Edge UI; model/ASR/microphone fixtures. Not model quality or physical microphone verification.'},null,2));
 await context.close();await browser.close();browser=null;
})().catch(async error=>{console.error(error.stack);if(browser)await browser.close();process.exitCode=1;});
