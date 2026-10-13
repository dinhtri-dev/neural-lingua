// Verify actual CDN response bytes, not just a declared manifest fingerprint.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base=process.env.PREVIEW_URL,expected=process.env.PUBLIC_PACKAGE_SHA256||'58b0fbbde8e1f5822407f1f8fbdfe939e3587f56b5733965542d77b2a2af547c';
assert(base&&new URL(base).protocol==='https:','Set PREVIEW_URL to the HTTPS preview or production URL');
const out=process.env.QA_OUT_DIR||path.resolve(__dirname,'../test-results/public');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const r=await fetch(base+'/build-manifest.json');assert.equal(r.status,200);const manifest=await r.json();assert.equal(manifest.package_sha256,expected);
 // Recompute the Python builder's canonical fingerprint; a remote declaration
 // alone cannot certify that the remote entries are the expected package.
 const fingerprint=entries=>crypto.createHash('sha256').update(JSON.stringify(entries.map(entry=>Object.fromEntries(Object.keys(entry).sort().map(key=>[key,entry[key]]))))).digest('hex');
 assert.equal(fingerprint(manifest.files),expected,'Remote file inventory does not match the trusted release fingerprint');
 const tampered=structuredClone(manifest.files);tampered[0].sha256='0'.repeat(64);
 assert.notEqual(fingerprint(tampered),expected,'Regression: changed entries cannot keep the declared package fingerprint');
 const verified=[];
 for(const entry of manifest.files){
  if(entry.path==='_headers')continue; // Netlify consumes this control file; actual headers tested separately.
  const response=await fetch(base+'/'+entry.path);assert.equal(response.status,200,entry.path);const raw=Buffer.from(await response.arrayBuffer());
  assert.equal(raw.length,entry.bytes,entry.path);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),entry.sha256,entry.path);
  if(entry.path.endsWith('.wasm'))assert.match(response.headers.get('content-type'),/^application\/wasm/);
  if(/\.(m?js)$/.test(entry.path))assert.match(response.headers.get('content-type'),/javascript/);
  verified.push(entry.path);
 }
 fs.writeFileSync(path.join(out,'cdn-package-results.json'),JSON.stringify({base,package_sha256:expected,verified,providerControlFiles:['_headers'],passed:true},null,2));console.log('PASS actual CDN bytes/hash/MIME:',verified.length,'files');
})().catch(e=>{console.error(e.message);process.exit(1);});
