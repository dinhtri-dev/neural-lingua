const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8851',root=path.resolve(__dirname,'..'),out=process.env.QA_OUT_DIR||path.join(root,'test-results/public');
fs.mkdirSync(out,{recursive:true});let browser;const results=[];
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 async function scenario(mode){
  const ctx=await browser.newContext(),p=await ctx.newPage(),counts={};
  for(const name of ['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs']){
   await ctx.route('**/voice-assets/vendor/'+name,async r=>{
    counts[name]=(counts[name]||0)+1;let raw=fs.readFileSync(path.join(root,'voice-assets/vendor',name));
    if(mode==='tamper-first'&&name==='transformers.min.js')raw=Buffer.concat([raw,Buffer.from('\nthrow new Error("Unverified executed");')]);
    if(mode==='hot-swap'&&counts[name]>1)raw=Buffer.concat([raw,Buffer.from('\nthrow new Error("Unverified second fetch executed");')]);
    await r.fulfill({contentType:'text/javascript',body:raw});
   });
  }
  await p.goto(base+'/#translate');await p.locator('#recordButton').waitFor();
  if(mode==='bad-cache')await p.evaluate(async()=>{const c=await caches.open('neural-lingua-voice-verified-v1');await c.put('/voice-assets/models/Xenova/whisper-tiny/onnx/encoder_model_quantized.onnx',new Response('corrupt',{status:200}));localStorage.setItem('integrity-sentinel','keep');});
  await p.locator('#recordButton').click();await p.waitForFunction(()=>!document.querySelector('#recordButton').disabled,{},{timeout:180000});
  const notice=await p.locator('#voiceStatus').innerText();
  if(mode==='tamper-first'){assert.match(notice,/Không tải được/);assert.equal(await p.locator('#recordButton').innerText(),'Chuẩn bị ghi âm');}
  else {assert.equal(await p.locator('#recordButton').innerText(),'Ghi âm',notice);for(const n of Object.keys(counts))assert.equal(counts[n],1,'Executable must not be fetched twice');}
  if(mode==='bad-cache')assert.deepEqual(await p.evaluate(async()=>{const r=await (await caches.open('neural-lingua-voice-verified-v1')).match('/voice-assets/models/Xenova/whisper-tiny/onnx/encoder_model_quantized.onnx');return [(await r.arrayBuffer()).byteLength,localStorage.getItem('integrity-sentinel')];}),[10124910,'keep']);
  results.push({mode,passed:true,counts,notice});console.log('PASS voice integrity',mode);await ctx.close();
 }
 for(const mode of ['hot-swap','tamper-first','bad-cache'])await scenario(mode);
 await browser.close();fs.writeFileSync(path.join(out,'voice-integrity-results.json'),JSON.stringify({base,passed:results.length,results},null,2));
})().catch(async e=>{console.error(e.stack);fs.writeFileSync(path.join(out,'voice-integrity-results.json'),JSON.stringify({base,passed:results.length,results,error:e.message},null,2));await browser?.close();process.exit(1);});
