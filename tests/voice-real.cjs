// Real pinned Whisper/WASM + MediaRecorder with a locally synthesized WAV.
// No physical microphone or speech-accuracy benchmark is implied.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8851',fixture=process.env.VOICE_TEST_WAV;
if(!fixture||!fs.existsSync(fixture))throw new Error('Set VOICE_TEST_WAV to an English WAV saying My name is Anna. I live in Washington.');
const out=process.env.QA_OUT_DIR||path.resolve(__dirname,'../test-results/public');fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+fixture]});
 const ctx=await browser.newContext({permissions:['microphone']}),p=await ctx.newPage(),requests=[],errors=[];
 await ctx.addInitScript(()=>{window.micCalls=0;window.streams=[];const real=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async o=>{window.micCalls++;const s=await real(o);window.streams.push(s);return s;};});
 ctx.on('request',r=>requests.push({url:r.url(),method:r.method(),bytes:r.postDataBuffer()?.length||0}));p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/#translate');await p.locator('#recordButton').waitFor();assert(!requests.some(r=>r.url.includes('voice-assets')));assert.equal(await p.evaluate(()=>window.micCalls),0);
 await p.locator('#sourceLanguage').selectOption('en');await p.locator('#recordButton').click();await p.waitForFunction(()=>!document.querySelector('#recordButton').disabled,{},{timeout:180000});
 const preparation=await p.locator('#voiceStatus').innerText();assert.equal(await p.locator('#recordButton').innerText(),'Ghi âm',preparation);assert.equal(await p.evaluate(()=>window.micCalls),0);
 await p.locator('#textInput').fill('Previous text.');await p.locator('#recordButton').click();await p.waitForFunction(()=>document.querySelector('#recordButton').getAttribute('aria-pressed')==='true');await p.waitForTimeout(6200);await p.locator('#recordButton').click();await p.waitForFunction(()=>!document.querySelector('#recordButton').disabled,{},{timeout:120000});
 const text=await p.locator('#textInput').inputValue(),notice=await p.locator('#voiceStatus').innerText();assert.match(text,/Anna/i);assert.match(text,/Washington/i);assert(text.startsWith('Previous text.'));assert(await p.evaluate(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
 assert(!requests.some(r=>r.method!=='GET'||r.bytes));assert(!requests.some(r=>new URL(r.url).origin!==new URL(base).origin));assert.deepEqual(errors,[]);
 // Retry via an independently created worker: verified custom model cache remains usable.
 await p.locator('[data-nav=roadmap]').click();await p.locator('[data-nav=translate]').click();await p.locator('#recordButton').click();await p.waitForFunction(()=>!document.querySelector('#recordButton').disabled,{},{timeout:180000});assert.equal(await p.locator('#recordButton').innerText(),'Ghi âm');
 // Observe the actual 29.5s safety timer, without accelerating browser time.
 const timedAt=Date.now();await p.locator('#recordButton').click();
 await p.waitForFunction(()=>document.querySelector('#recordButton').getAttribute('aria-pressed')==='true');
 await p.waitForFunction(()=>window.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')),{},{timeout:35000});
 const stoppedAfterMs=Date.now()-timedAt;assert(stoppedAfterMs>=29000&&stoppedAfterMs<33000);
 await p.waitForFunction(()=>!document.querySelector('#recordButton').disabled,{},{timeout:120000});
 assert(!requests.some(r=>r.method!=='GET'||r.bytes));assert(!requests.some(r=>new URL(r.url).origin!==new URL(base).origin));
 await p.screenshot({path:path.join(out,'voice-real.png'),fullPage:true});
 fs.writeFileSync(path.join(out,'voice-real-results.json'),JSON.stringify({passed:true,base,version:browser.version(),text,notice,stoppedAfterMs,requests,errors,limits:'Real Whisper and browser audio APIs; synthesized WAV via fake microphone. Actual 29.5s timer observed. Physical microphone and broad accent/device accuracy are not tested.'},null,2));console.log('PASS real Whisper, verified downloads/cache, no audio uploads:',text,'actual stop ms',stoppedAfterMs);await browser.close();
})().catch(async e=>{console.error(e.stack);fs.writeFileSync(path.join(out,'voice-real-results.json'),JSON.stringify({passed:false,base,error:e.message},null,2));await browser?.close();process.exit(1);});
