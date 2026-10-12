// A small, transparent course diagnostic; these are not CEFR test items.
export const PLACEMENT_VERSION=1;
export const SKILLS={vocabulary:'Từ vựng',grammar:'Mẫu câu',usage:'Đọc & dùng câu'};
export const PLACEMENT_QUESTIONS=[
 {id:'p01',group:0,skill:'grammar',lesson:1,prompt:'Maya ___ a student.',choices:['am','is','are','be'],answer:1,explanation:'Maya là một người, dùng is.'},
 {id:'p02',group:0,skill:'vocabulary',lesson:5,prompt:'Which room do you cook in?',choices:['Bedroom','Bathroom','Kitchen','Living room'],answer:2,explanation:'Kitchen là nhà bếp, nơi nấu ăn.'},
 {id:'p03',group:0,skill:'usage',lesson:6,prompt:'Bạn muốn hỏi đường tới thư viện. Chọn câu phù hợp.',choices:['What is your name?','How old is the library?','I am reading a book.','Where is the library?'],answer:3,explanation:'Where is ...? dùng để hỏi vị trí.'},
 {id:'p04',group:1,skill:'grammar',lesson:18,prompt:'His sister always ___ tennis on Sundays.',choices:['play','plays','playing','played'],answer:1,explanation:'His sister là ngôi thứ ba số ít; hiện tại đơn dùng plays.'},
 {id:'p05',group:1,skill:'vocabulary',lesson:12,prompt:'Your aunt’s child is your ___.',choices:['parent','cousin','uncle','grandmother'],answer:1,explanation:'Cousin là anh/chị/em họ.'},
 {id:'p06',group:1,skill:'usage',lesson:20,prompt:'“Can you swim?” — Chọn câu trả lời về khả năng.',choices:['Yes, I can.','It is in the kitchen.','On Monday.','She is my sister.'],answer:0,explanation:'Can hỏi khả năng; trả lời Yes, I can.'},
 {id:'p07',group:2,skill:'grammar',lesson:24,prompt:'We ___ at home yesterday.',choices:['are','is','was','were'],answer:3,explanation:'Yesterday chỉ quá khứ; chủ ngữ We dùng were.'},
 {id:'p08',group:2,skill:'vocabulary',lesson:29,prompt:'“Two days ago” có nghĩa là gì?',choices:['Hai ngày nữa','Mỗi hai ngày','Hai ngày trước','Trong hai ngày'],answer:2,explanation:'Ago chỉ thời gian đã qua.'},
 {id:'p09',group:2,skill:'usage',lesson:26,prompt:'Your friend is tired. Which sentence gives advice?',choices:['You were tired yesterday.','You should get some rest.','I am taller than you.','The party is tomorrow.'],answer:1,explanation:'Should + động từ dùng để đưa lời khuyên.'},
 {id:'p10',group:3,skill:'grammar',lesson:35,prompt:'Do we have ___ milk left?',choices:['any','many','a','an'],answer:0,explanation:'Câu hỏi về danh từ không đếm được milk dùng any.'},
 {id:'p11',group:3,skill:'vocabulary',lesson:36,prompt:'“I can fix this bike.” — “fix” có nghĩa là gì?',choices:['mua','mượn','sửa','lái'],answer:2,explanation:'Fix ở đây có nghĩa là sửa chữa.'},
 {id:'p12',group:3,skill:'usage',lesson:37,prompt:'Bạn muốn bất đồng lịch sự với một ý kiến. Chọn câu phù hợp.',choices:['Turn left here.','Give it to me now.','I have two brothers.','I see your point, but I disagree.'],answer:3,explanation:'Thừa nhận ý của người khác rồi nói I disagree là cách bất đồng lịch sự.'},
 {id:'p13',group:4,skill:'grammar',lesson:48,prompt:'I ___ never been to London.',choices:['am','was','have','will'],answer:2,explanation:'Have + been diễn đạt trải nghiệm trong hiện tại hoàn thành.'},
 {id:'p14',group:4,skill:'vocabulary',lesson:46,prompt:'“May I borrow your pen?” — “borrow” có nghĩa là gì?',choices:['mua','mượn','bán','làm mất'],answer:1,explanation:'Borrow là mượn để dùng rồi trả lại.'},
 {id:'p15',group:4,skill:'usage',lesson:43,prompt:'Bạn cần người khác mở cửa giúp. Chọn yêu cầu lịch sự.',choices:['Could you open the door, please?','You opened the door yesterday.','The door is blue.','I never open doors.'],answer:0,explanation:'Could you ... please? là mẫu câu nhờ giúp lịch sự.'}
];
const englishPrompts=new Set(['p01','p02','p04','p05','p07','p09','p10','p13']);
const vietnameseChoices=new Set(['p08','p11','p14']);
const englishQuotes={p06:'“Can you swim?”',p08:'“Two days ago”',p11:'“I can fix this bike.”',p14:'“May I borrow your pen?”'};
for(const q of PLACEMENT_QUESTIONS){q.promptLang=englishPrompts.has(q.id)?'en':'vi';q.choicesLang=vietnameseChoices.has(q.id)?'vi':'en';q.englishQuote=englishQuotes[q.id];}

export function questionSkill(q){return q.id.endsWith('-grammar')?'grammar':q.kind==='scenario'||q.id.endsWith('-apply')?'usage':'vocabulary';}
export function quizSkills(lesson,answers){
 const skills=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{correct:0,total:0}]));
 for(const q of lesson.quiz){const s=skills[questionSkill(q)];s.total++;if((q.acceptedAnswers||[q.answer]).includes(answers[q.id]))s.correct++;}
 return skills;
}
export function evaluatePlacement(answers){
 if(!answers||typeof answers!=='object'||!PLACEMENT_QUESTIONS.every(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=-1&&answers[q.id]<q.choices.length))return null;
 const groups=Array.from({length:5},()=>({correct:0,total:0}));
 const skills=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{correct:0,total:0}]));
 let answered=0;
 for(const q of PLACEMENT_QUESTIONS){const ok=answers[q.id]===q.answer;groups[q.group].total++;skills[q.skill].total++;if(answers[q.id]!==-1)answered++;if(ok){groups[q.group].correct++;skills[q.skill].correct++;}}
 const gap=groups.findIndex(g=>g.correct<2);
 return {groups,skills,answered,correct:groups.reduce((sum,g)=>sum+g.correct,0),startGroup:gap<0?4:gap};
}
export function learningPlan(course,data){
 const diagnostic=data.placement?.version===PLACEMENT_VERSION?evaluatePlacement(data.placement.answers):null;
 const start=diagnostic?course.groups[diagnostic.startGroup].start:1;
 const since=data.placement?.sequence||0;
 const recent=course.lessons.map(lesson=>({lesson,progress:data.lessons[lesson.id],attempt:data.lessons[lesson.id]?.attempts?.at(-1)})).filter(x=>x.attempt&&x.attempt.sequence>since).sort((a,b)=>b.attempt.sequence-a.attempt.sequence);
 const weak=recent.find(x=>x.attempt.score<4);
 let lesson,reason,kind='learn',section='';
 if(weak){
  lesson=weak.lesson;kind='review';
  const skill=Object.entries(weak.attempt.skills||{}).filter(([,v])=>v.total>0).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total)[0]?.[0];
  section=skill==='usage'?'practice':skill==='grammar'?'grammar':skill?'vocabulary':'quiz';
  reason=`Lượt gần nhất ở bài ${lesson.number} đạt ${weak.attempt.score}/5${skill?`; nên củng cố ${SKILLS[skill].toLowerCase()}`:''}. Điểm tốt nhất vẫn được giữ.`;
 }else{
  const last=course.lessons.find(l=>l.id===data.lastLesson&&(!diagnostic||data.lastLessonSequence>since)&&l.number>=start&&!data.lessons[l.id]?.complete);
  lesson=last||course.lessons.find(l=>l.number>=start&&!data.lessons[l.id]?.complete);
  if(!lesson){kind='consolidate';lesson=course.lessons.find(l=>!data.lessons[l.id]?.complete)||course.lessons[0];reason='Bạn đã hoàn thành các bài từ mốc gợi ý; hãy củng cố những bài còn lại hoặc ôn lại.';}
  else reason=diagnostic?`Đầu vào gợi ý bắt đầu ở bài ${start}; bài ${lesson.number} là bài đang học hoặc chưa hoàn thành trong lộ trình đó.`:'Chưa có kết quả đầu vào: tiếp tục bài đang học, hoặc bắt đầu từ bài 1.';
 }
 const upcoming=[lesson,...course.lessons.filter(l=>l.id!==lesson.id&&l.number>=start&&!data.lessons[l.id]?.complete)].slice(0,5);
 const stats=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{correct:0,total:0}]));
 if(recent.length){for(const x of recent.slice(0,12))for(const k of Object.keys(SKILLS)){const s=x.attempt.skills?.[k];if(s){stats[k].correct+=s.correct;stats[k].total+=s.total;}}}
 else if(diagnostic)for(const k of Object.keys(SKILLS))stats[k]={...diagnostic.skills[k]};
 return {lesson,kind,reason,section,href:`#lesson/${lesson.number}${section?'/'+section:''}`,start,diagnostic,upcoming,stats,statsSource:recent.length?`${Math.min(recent.length,12)} bài làm gần nhất (mỗi bài lấy lượt mới nhất)`:diagnostic?'Bài kiểm tra đầu vào':'Chưa có kết quả đầu vào hoặc bài học'};
}
