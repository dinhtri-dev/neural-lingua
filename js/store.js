const PROGRESS='neural-lingua.learning.v1',PREF='neural-lingua.preferences.v1';
const empty=()=>({lessons:{},words:{},lastLesson:null});
export class LearningStore {
 constructor(course){
  this.course=course;this.ids=new Set(course.lessons.map(l=>l.id));this.enabled=true;this.available=true;this.warning='';this.resetVersion=0;this.data=empty();this.localQueue=Promise.resolve();
  try{this.readLatest();}catch{this.available=false;this.warning='Không đọc được dữ liệu lưu. Bạn vẫn có thể học; dữ liệu hỏng không được dùng.';}
  window.addEventListener('storage',e=>{
   if(![PROGRESS,PREF,null].includes(e.key))return;
   try{const oldReset=this.resetVersion;this.readLatest();this.changed(true,this.resetVersion!==oldReset||e.key===null||(e.key===PROGRESS&&e.newValue===null&&this.enabled));}
   catch{this.warning='Không đọc được cập nhật từ tab khác. Hãy tải lại trước khi tiếp tục.';this.notice();}
  });
 }
 validate(raw){
  const d=empty();if(!raw||typeof raw!=='object')return d;
  for(const [id,v] of Object.entries(raw.lessons||{}))if(this.ids.has(id)&&v&&typeof v==='object')d.lessons[id]={started:v.started===true,complete:v.complete===true&&Number.isInteger(v.best)&&v.best>=4&&v.best<=5,best:Number.isInteger(v.best)&&v.best>=0&&v.best<=5?v.best:0};
  for(const [id,v] of Object.entries(raw.words||{})){const [lesson,index]=id.split(':');if(this.ids.has(lesson)&&/^\d$/.test(index)&&+index<6&&['new','unknown','known'].includes(v))d.words[id]=v;}
  if(this.ids.has(raw.lastLesson))d.lastLesson=raw.lastLesson;return d;
 }
 readLatest(){
  const pref=JSON.parse(localStorage.getItem(PREF)||'{}'),reset=Number.isSafeInteger(pref.resetVersion)?pref.resetVersion:0;
  if(reset!==this.resetVersion)this.data=empty();this.resetVersion=reset;this.enabled=pref.saveProgress!==false;
  if(this.enabled)this.data=this.validate(JSON.parse(localStorage.getItem(PROGRESS)||'{}'));
 }
 changed(external=false,reset=false){window.dispatchEvent(new CustomEvent('learningchange',{detail:{external,reset}}));this.notice();}
 notice(){const n=document.getElementById('storageWarning');if(n){n.textContent=this.warning;n.hidden=!this.warning;}}
 lock(action){
  const run=()=>action();
  if(navigator.locks?.request)return navigator.locks.request('neural-lingua.learning',run);
  this.warning='Trình duyệt này chỉ hỗ trợ lưu ổn định trong một tab. Hãy dùng một tab học để tránh ghi đè dữ liệu.';this.notice();
  const next=this.localQueue.then(run,run);this.localQueue=next.catch(()=>{});return next;
 }
 mutate(fn){return this.lock(()=>{
  try{if(this.available)this.readLatest();}catch{this.warning='Không đọc được bản lưu hiện tại; thay đổi chỉ giữ trong phiên này.';this.available=false;}
  const result=fn(this.data);
  if(this.enabled&&this.available)try{localStorage.setItem(PROGRESS,JSON.stringify(this.data));}catch{this.available=false;this.warning='Thiết bị không cho lưu dữ liệu. Tiến độ hiện chỉ giữ trong phiên đang mở.';}
  this.changed();return result;
 });}
 setEnabled(enabled){return this.lock(()=>{
  this.enabled=enabled;
  try{const pref=JSON.parse(localStorage.getItem(PREF)||'{}');localStorage.setItem(PREF,JSON.stringify({saveProgress:enabled,resetVersion:pref.resetVersion||0}));if(!enabled)localStorage.removeItem(PROGRESS);else localStorage.setItem(PROGRESS,JSON.stringify(this.data));this.available=true;this.warning='';}
  catch{this.warning='Không thể thay đổi dữ liệu lưu trên thiết bị. Kiểm tra quyền lưu trữ của trình duyệt.';this.notice();this.changed();return false;}
  this.changed();return true;
 });}
 started(id){if(!this.ids.has(id))return Promise.resolve();return this.mutate(d=>{d.lessons[id]??={started:false,complete:false,best:0};d.lessons[id].started=true;d.lastLesson=id;});}
 score(id,score){if(!this.ids.has(id)||!Number.isInteger(score)||score<0||score>5)return Promise.resolve();return this.mutate(d=>{d.lessons[id]??={started:false,complete:false,best:0};d.lessons[id].started=true;d.lastLesson=id;d.lessons[id].best=Math.max(d.lessons[id].best,score);});}
 complete(id){return this.mutate(d=>{if((d.lessons[id]?.best||0)>=4){d.lessons[id].complete=true;return true;}return false;});}
 saveWord(id,index){if(!this.ids.has(id)||!Number.isInteger(index)||index<0||index>=6)return Promise.resolve(false);return this.mutate(d=>{const key=`${id}:${index}`;if(d.words[key])delete d.words[key];else d.words[key]='new';return !!d.words[key];});}
 wordState(key,state){return this.mutate(d=>{if(d.words[key]&&['known','unknown','new'].includes(state))d.words[key]=state;});}
 removeWord(key){return this.mutate(d=>{delete d.words[key];});}
 reset(){return this.lock(()=>{
  this.data=empty();try{const pref=JSON.parse(localStorage.getItem(PREF)||'{}');this.resetVersion=(Number.isSafeInteger(pref.resetVersion)?pref.resetVersion:0)+1;localStorage.removeItem(PROGRESS);localStorage.setItem(PREF,JSON.stringify({saveProgress:pref.saveProgress!==false,resetVersion:this.resetVersion}));this.warning='';this.available=true;}
  catch{this.warning='Không thể xóa dữ liệu trên thiết bị. Hãy dùng phần quản lý dữ liệu trang của trình duyệt.';this.notice();return false;}
  this.changed(false,true);return true;
 });}
 count(){return Object.values(this.data.lessons).filter(l=>l.complete).length;}
 next(){return this.course.lessons.find(l=>l.id===this.data.lastLesson&&!this.data.lessons[l.id]?.complete)||this.course.lessons.find(l=>!this.data.lessons[l.id]?.complete)||this.course.lessons[0];}
}
