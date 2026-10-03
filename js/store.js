const PROGRESS='neural-lingua.learning.v1',PREF='neural-lingua.preferences.v1';
export class LearningStore{
 constructor(course){this.course=course;this.ids=new Set(course.lessons.map(l=>l.id));this.enabled=true;this.available=true;this.warning='';this.data={lessons:{},words:{},lastLesson:null};try{const pref=JSON.parse(localStorage.getItem(PREF)||'{}');this.enabled=pref.saveProgress!==false;const raw=this.enabled?JSON.parse(localStorage.getItem(PROGRESS)||'{}'):{};this.data=this.validate(raw);}catch{this.warning='Không đọc được dữ liệu lưu. Bạn vẫn có thể học; dữ liệu hỏng không được dùng.';}}
 validate(raw){const d={lessons:{},words:{},lastLesson:null};if(!raw||typeof raw!=='object')return d;for(const [id,v]of Object.entries(raw.lessons||{})){if(this.ids.has(id)&&v&&typeof v==='object')d.lessons[id]={started:v.started===true,complete:v.complete===true&&Number.isInteger(v.best)&&v.best>=4&&v.best<=5,best:Number.isInteger(v.best)&&v.best>=0&&v.best<=5?v.best:0};}for(const [id,v]of Object.entries(raw.words||{})){const [lesson,index]=id.split(':');if(this.ids.has(lesson)&&/^\d$/.test(index)&&+index<6&&['new','unknown','known'].includes(v))d.words[id]=v;}if(this.ids.has(raw.lastLesson))d.lastLesson=raw.lastLesson;return d;}
 write(){if(!this.enabled)return;try{localStorage.setItem(PROGRESS,JSON.stringify(this.data));}catch{this.available=false;this.warning='Thiết bị không cho lưu dữ liệu. Tiến độ hiện chỉ giữ trong phiên đang mở.';this.notice();}}
 notice(){const n=document.getElementById('storageWarning');if(n){n.textContent=this.warning;n.hidden=!this.warning;}}
 setEnabled(enabled){this.enabled=enabled;try{localStorage.setItem(PREF,JSON.stringify({saveProgress:enabled}));if(!enabled)localStorage.removeItem(PROGRESS);else this.write();}catch{this.warning='Không thể thay đổi dữ liệu lưu trên thiết bị. Kiểm tra quyền lưu trữ của trình duyệt.';this.notice();}}
 started(id){if(!this.ids.has(id))return;this.data.lessons[id]??={started:false,complete:false,best:0};this.data.lessons[id].started=true;this.data.lastLesson=id;this.write();}
 score(id,score){this.started(id);this.data.lessons[id].best=Math.max(this.data.lessons[id].best,score);this.write();}
 complete(id){if((this.data.lessons[id]?.best||0)>=4){this.data.lessons[id].complete=true;this.write();return true;}return false;}
 saveWord(id,index){const key=`${id}:${index}`;if(this.data.words[key])delete this.data.words[key];else this.data.words[key]='new';this.write();return !!this.data.words[key];}
 wordState(key,state){if(this.data.words[key]){this.data.words[key]=state;this.write();}}
 removeWord(key){delete this.data.words[key];this.write();}
 reset(){this.data={lessons:{},words:{},lastLesson:null};try{localStorage.removeItem(PROGRESS);}catch{this.warning='Không thể xóa dữ liệu trên thiết bị. Hãy dùng phần quản lý dữ liệu trang của trình duyệt.';this.notice();return false;}return true;}
 count(){return Object.values(this.data.lessons).filter(l=>l.complete).length;}
 next(){return this.course.lessons.find(l=>l.id===this.data.lastLesson&&!this.data.lessons[l.id]?.complete)||this.course.lessons.find(l=>!this.data.lessons[l.id]?.complete)||this.course.lessons[0];}
}
