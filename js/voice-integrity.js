// All voice downloads are same-origin and checked before inference/cache use.
const VERSION='3.8.1', REVISION='5332fcc35e32a33b86612b9a57a89be7906102b1';
export async function verifiedVoiceRuntime(){
 const root=new URL('../',import.meta.url), originalFetch=self.fetch.bind(self);
 const response=await originalFetch(new URL('data/voice-assets-manifest.json',root),{credentials:'omit',cache:'no-store'});
 if(!response.ok)throw new Error('Voice manifest unavailable');
 const manifest=await response.json();
 const names=['vendor/transformers.min.js','vendor/ort-wasm-simd-threaded.jsep.mjs','vendor/ort-wasm-simd-threaded.jsep.wasm','vendor/LICENSE',...['config.json','generation_config.json','preprocessor_config.json','tokenizer.json','tokenizer_config.json','onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'].map(n=>'models/Xenova/whisper-tiny/'+n)];
 const expected=new Set(names.map(n=>'voice-assets/'+n));
 if(manifest.transformers_js!==VERSION||manifest.revision!==REVISION||manifest.model!=='Xenova/whisper-tiny'||manifest.files?.length!==expected.size)throw new Error('Invalid voice version');
 const entries=new Map();
 for(const entry of manifest.files){
  if(!expected.has(entry.path)||entries.has(new URL(entry.path,root).href)||!Number.isSafeInteger(entry.bytes)||entry.bytes<=0||entry.bytes>40*1024*1024||!/^[a-f0-9]{64}$/.test(entry.sha256))throw new Error('Invalid voice manifest');
  entries.set(new URL(entry.path,root).href,entry);
 }
 const key=input=>new URL(typeof input==='string'?input:input.url,root).href;
 async function checked(input,result){
  const entry=entries.get(key(input));
  if(!entry||!result?.ok)throw new Error('Unapproved voice download');
  const raw=await result.clone().arrayBuffer();
  if(raw.byteLength!==entry.bytes)throw new Error('Voice size mismatch');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==entry.sha256)throw new Error('Voice checksum mismatch');
  return result;
 }
 self.fetch=async(input,options)=>{
  if(!entries.has(key(input)))throw new Error('Unexpected voice request');
  return checked(input,await originalFetch(input,{...options,credentials:'omit'}));
 };
 // Execute the EXACT verified bytes, not a second unchecked module download.
 const runtimeBytes=await (await self.fetch(new URL('voice-assets/vendor/transformers.min.js',root).href)).blob();
 const onnxBytes=await (await self.fetch(new URL('voice-assets/vendor/ort-wasm-simd-threaded.jsep.mjs',root).href)).blob();
 const runtimeUrl=URL.createObjectURL(new Blob([runtimeBytes],{type:'text/javascript'}));
 const onnxUrl=URL.createObjectURL(new Blob([onnxBytes],{type:'text/javascript'}));
 let runtime;
 try{runtime=await import(runtimeUrl);}finally{URL.revokeObjectURL(runtimeUrl);}
 runtime.env.backends.onnx.wasm.wasmPaths={mjs:onnxUrl,wasm:new URL('voice-assets/vendor/ort-wasm-simd-threaded.jsep.wasm',root).href};
 runtime.env.useBrowserCache=false;
 runtime.env.useCustomCache=!!self.caches;
 if(self.caches){
  const cache=await caches.open('neural-lingua-voice-verified-v1');
  runtime.env.customCache={
   async match(input){const result=await cache.match(input);if(!result)return undefined;try{return await checked(input,result);}catch{await cache.delete(input);return undefined;}},
   async put(input,result){await checked(input,result);await cache.put(input,result);},
  };
 }
 return runtime;
}
