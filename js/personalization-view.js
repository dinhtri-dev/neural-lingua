import {el,status} from './dom.js';
import {PLACEMENT_QUESTIONS,evaluatePlacement,learningPlan,SKILLS} from './personalization.js';

function skillCards(plan){return el('div',{class:'skill-grid'},...Object.entries(plan.stats).map(([key,s])=>el('div',{class:'skill-card'},el('strong',{},SKILLS[key]),el('p',{},s.total?`${s.correct}/${s.total} câu đúng · ${Math.round(s.correct/s.total*100)}%`:'Chưa có dữ liệu'),el('progress',{value:s.correct,max:s.total||1,'aria-label':`${SKILLS[key]}: ${s.correct} trên ${s.total} câu đúng`}))));}
function questionText(q){if(!q.englishQuote)return el('span',{lang:q.promptLang},q.prompt);const [before,after]=q.prompt.split(q.englishQuote);return [before,el('span',{lang:'en'},q.englishQuote),after];}
export function personalDashboard(course,store){
 const p=learningPlan(course,store.data);
 return el('section',{class:'panel personal-dashboard','aria-labelledby':'personalTitle'},el('p',{class:'eyebrow'},'Dành riêng cho bạn'),el('h2',{id:'personalTitle'},'Lộ trình học cá nhân hóa'),el('p',{id:'recommendationReason'},p.reason),el('div',{class:'actions'},el('a',{class:'button-link',id:'personalNext',href:p.href},`${p.kind==='review'?'Củng cố':p.kind==='consolidate'?'Ôn / học':'Học'} bài ${p.lesson.number} →`),el('a',{id:'placementLink',href:'#placement'},p.diagnostic?'Làm lại bài kiểm tra đầu vào':'Kiểm tra đầu vào · 15 câu')),p.diagnostic?el('p',{class:'muted',id:'placementOverview'},`Đầu vào: ${p.diagnostic.correct}/15 câu đúng · mốc gợi ý: bài ${p.start}. Các bài trước vẫn mở và không được tự đánh dấu hoàn thành.`):el('p',{class:'muted'},'Bạn có thể bỏ qua đầu vào và học theo thứ tự. Điểm bài tập sau đó vẫn giúp điều chỉnh gợi ý.'),skillCards(p),el('p',{class:'video-note'},p.statsSource+'. Nhóm câu hỏi tự luyện, chưa đánh giá nghe, nói hoặc năng lực CEFR.'),el('h3',{},`${p.upcoming.length} bài gợi ý tiếp theo`),el('ol',{class:'personal-queue',id:'personalQueue'},...p.upcoming.map((l,i)=>el('li',{},el('a',{href:i===0?p.href:`#lesson/${l.number}`},`Bài ${l.number} · ${l.title}`)))),el('p',{class:'video-note'},'Gợi ý thay đổi khi bạn nộp bài. Bạn luôn có thể chọn bất kỳ bài nào ở danh sách bên dưới.'));
}
export function recommendationPanel(course,store){const p=learningPlan(course,store.data);return el('div',{class:'callout',id:'lessonRecommendation',role:'status'},el('strong',{},'Bước học được gợi ý'),el('p',{},p.reason),el('a',{href:p.href},`${p.kind==='review'?'Củng cố':'Mở'} bài ${p.lesson.number} →`),el('p',{},el('a',{href:'#roadmap'},'Xem lộ trình cá nhân hóa')));}

export function placementView(course,store){
 let index=0,answers={},submitting=false,active=true,completedAnswers=null,completedSequence=0;
 const root=el('article',{class:'placement-page'}),body=el('div',{id:'placementBody'});
 const notice=el('p',{class:'status',role:'status',hidden:true});
 const progress=el('p',{id:'placementProgress',class:'muted',role:'status','aria-live':'polite'});
 root.append(el('a',{class:'breadcrumb',href:'#roadmap'},'← Về lộ trình'),el('h1',{},'Bắt đầu ở bài phù hợp với bạn'),el('p',{class:'subheading'},'15 câu · khoảng 5–7 phút · 3 câu thăm dò mỗi chặng. Chọn “Chưa biết” nếu cần; đây là gợi ý học trong khóa, không phải bài thi CEFR.'),el('p',{class:'video-note'},'Bài này kiểm tra từ vựng, mẫu câu và đọc tình huống; không đánh giá nghe hoặc nói. Kết quả mới chỉ thay mốc đầu vào, giữ nguyên tiến độ và từ đã lưu. Câu đang làm chỉ giữ khi bạn ở trang này; hãy hoàn tất trước khi chuyển trang.'),progress,body,notice);
 function refreshResult(){
  const panel=body.querySelector('#placementCurrentPlan');if(!active||!completedAnswers||!panel)return;
  const p=learningPlan(course,store.data),changed=store.data.placement?.sequence!==completedSequence||PLACEMENT_QUESTIONS.some(q=>store.data.placement?.answers[q.id]!==completedAnswers[q.id]);
  panel.replaceChildren(...(changed?[el('p',{class:'video-note',id:'placementUpdated'},'Lộ trình đã được cập nhật ở tab khác. Điểm và giải thích phía trên là của lần làm này; gợi ý dưới đây dùng kết quả hiện hành.')]:[]),el('p',{id:'placementCurrentStart'},p.diagnostic?`Gợi ý bắt đầu ở bài ${p.start}.`:'Hiện chưa có kết quả đầu vào được lưu; gợi ý dựa trên tiến độ bài học.'),el('p',{},p.reason),el('a',{class:'button-link',id:'startPersonalLearning',href:p.href},`Bắt đầu bài ${p.lesson.number} →`));
 }
 function draw(focus=false){
  const q=PLACEMENT_QUESTIONS[index];progress.textContent=`Câu ${index+1}/15 · ${Object.keys(answers).length}/15 câu đã chọn · Chặng ${q.group+1}`;
  const form=el('form',{id:'placementForm'}),fieldset=el('fieldset',{class:'quiz-question'},el('legend',{id:'placementQuestion',tabindex:-1},`${index+1}. `,questionText(q)));
  const next=el('button',{type:'submit',id:'placementNext',disabled:submitting},index===14?'Xem lộ trình của tôi':'Câu tiếp →');
  for(const [j,c] of [...q.choices,'Chưa biết'].entries()){const value=j===q.choices.length?-1:j;fieldset.append(el('label',{class:'quiz-option'},el('input',{type:'radio',name:q.id,value,checked:answers[q.id]===value,onchange:()=>{if(submitting||!active)return;answers[q.id]=value;status(notice,'');progress.textContent=`Câu ${index+1}/15 · ${Object.keys(answers).length}/15 câu đã chọn · Chặng ${q.group+1}`;}}),el('span',{lang:value===-1?'vi':q.choicesLang},c)));}
  form.append(fieldset,el('div',{class:'actions'},el('button',{type:'button',class:'secondary',id:'placementPrevious',disabled:index===0||submitting,onclick:()=>{index--;status(notice,'');draw(true);}},'← Câu trước'),next),el('p',{},el('a',{href:'#roadmap'},'Học tiếp mà chưa kiểm tra đầu vào')));
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(submitting||!active)return;
   if(!Number.isInteger(answers[q.id])){status(notice,'Hãy chọn một đáp án hoặc “Chưa biết” trước khi tiếp tục.',true);fieldset.querySelector('input').focus();return;}
   if(index<14){index++;draw(true);return;}
   const snapshot={...answers};submitting=true;for(const control of form.querySelectorAll('input,button'))control.disabled=true;
   const saved=await store.setPlacement(snapshot);
   if(saved===false||!active||!root.isConnected)return;
   const result=evaluatePlacement(snapshot);completedAnswers=snapshot;completedSequence=store.data.placement?.sequence||0;
   body.replaceChildren(el('section',{class:'panel',id:'placementResult',tabindex:-1},el('h2',{},`Đầu vào: ${result.correct}/15 câu đúng`),el('p',{},`Lần làm này: ${result.answered}/15 câu có đáp án; “Chưa biết” tính là cần học lại.`),el('p',{},'Mỗi chặng chỉ có 3 câu: đạt 2/3 để đi tiếp, dừng ở chặng đầu cần củng cố. Nếu mọi chặng đều đạt, bắt đầu ở chặng cuối để xác nhận bằng bài tập. Đây là ước lượng sơ bộ và sẽ thay đổi theo kết quả học.'),skillCards({stats:result.skills}),el('div',{id:'placementCurrentPlan',role:'status','aria-live':'polite'}),el('p',{},el('a',{href:'#roadmap'},'Xem toàn bộ lộ trình')),el('details',{},el('summary',{},'Xem đáp án và giải thích'),...PLACEMENT_QUESTIONS.map(item=>el('p',{},`${item.id.slice(1)} · ${item.prompt} — ${snapshot[item.id]===item.answer?'Đúng':snapshot[item.id]===-1?'Chưa biết':'Chưa đúng'}. ${item.explanation}`)))));
   refreshResult();
   progress.textContent='Đã hoàn tất kiểm tra đầu vào';status(notice,'');body.firstChild.focus();
  });
  body.replaceChildren(form);if(focus)fieldset.querySelector('legend').focus();
 }
 draw();return {node:root,refresh:refreshResult,destroy:()=>{active=false;}};
}
