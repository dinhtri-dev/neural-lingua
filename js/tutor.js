import {el,field,status} from './dom.js';

export function englishForListening(answer){
 // Use explicitly labelled examples, never ASCII fragments from Vietnamese prose.
 const english=text=>/^[A-Za-z][A-Za-z0-9 ,.!?'’"“”();:\-]*$/.test(text)&&text.trim().split(/\s+/).length>=3;
 const examples=[...answer.matchAll(/(?:Câu đúng|Ví dụ|Câu sửa|Mẫu câu)\s*:\s*([^\n]+)/gi)]
  .map(match=>match[1].split(/(?<=[.!?])\s+/)[0].trim()).filter(english);
 if(examples.length)return examples.join(' ').slice(0,2000);
 const text=answer.trim();
 return english(text)?text.slice(0,2000):'';
}

export function tutorView(lesson,{getDraft=()=>''}={}){
 let destroyed=false,ready=false,busy=false,history=[],epoch=0;
 let activeRequest=null,healthController=null,poll=null,capture=null,audioURL=null;
 let focusWord=null,suggestionFocus=null;
 const healthNotice=el('p',{id:'tutorHealth',role:'status','aria-live':'polite',class:'status'},'Đang kiểm tra gia sư local…');
 const retryHealth=el('button',{type:'button',class:'secondary',hidden:true},'Kiểm tra kết nối lại');
 const notice=el('p',{id:'tutorStatus',role:'status','aria-live':'polite',class:'status',hidden:true});
 const contextNotice=el('p',{id:'tutorContext',class:'video-note'},'Gia sư dùng tài liệu bài và tối đa 3 lượt hỏi–đáp gần nhất; các lượt cũ vẫn hiện bên dưới.');
 const log=el('div',{class:'tutor-messages',role:'log','aria-label':'Hội thoại với gia sư','aria-live':'polite'});
 const question=el('textarea',{id:'tutorQuestion',rows:3,maxlength:2000,placeholder:'Hỏi về bài, viết câu cần sửa hoặc bắt đầu hội thoại…','aria-describedby':'tutorInputHelp'});
 const send=el('button',{type:'submit',id:'tutorSend',disabled:true},'Gửi gia sư');
 const cancel=el('button',{type:'button',class:'secondary',hidden:true},'Hủy yêu cầu');
 const reset=el('button',{type:'button',class:'secondary'},'Hội thoại mới');
 const record=el('button',{type:'button',class:'secondary',disabled:true},'Ghi âm tiếng Anh');
 const listenText=el('textarea',{id:'tutorListenText',rows:2,maxlength:2000,placeholder:'Câu tiếng Anh bạn muốn nghe'});
 const listen=el('button',{type:'button',class:'secondary'},'Nghe tiếng Anh');
 const stopSpeak=el('button',{type:'button',class:'secondary'},'Dừng đọc');
 const audio=el('audio',{controls:true,hidden:true,'aria-label':'Nghe lại bản ghi của bạn'});
 const word=el('select',{id:'tutorWord'},...lesson.vocabulary.map(v=>el('option',{value:v.word},v.word)));
 const vocabulary=el('button',{type:'button',class:'secondary'},'Hỏi về từ đã chọn');
 const grammar=el('button',{type:'button',class:'secondary'},'Giải thích mẫu câu');
 const conversation=el('button',{type:'button',class:'secondary'},'Luyện hội thoại');
 const writing=el('button',{type:'button',class:'secondary'},'Nhờ nhận xét bản nháp');
 const suggestionText=el('textarea',{id:'tutorSuggestion',readonly:true,rows:3});
 const useSuggestion=el('button',{type:'button'},'Dùng gợi ý này');
 const keepQuestion=el('button',{type:'button',class:'secondary'},'Giữ câu đang viết');
 const suggestion=el('div',{class:'callout',hidden:true},
  el('p',{},'Ô hỏi đang có nội dung. Xem gợi ý bên dưới trước khi thay câu đang viết.'),
  field('Gợi ý hoặc transcript mới','tutorSuggestion',suggestionText),
  el('div',{class:'actions'},useSuggestion,keepQuestion));
 const shortcuts=[vocabulary,grammar,conversation,writing,useSuggestion];
 const form=el('form',{},field('Câu hỏi hoặc transcript có thể sửa','tutorQuestion',question),
  el('p',{id:'tutorInputHelp',class:'video-note'},'Tối đa 2.000 ký tự. Ctrl/⌘ + Enter để gửi. Gợi ý và bản nháp chỉ gửi khi bấm Gửi gia sư.'),
  el('div',{class:'actions'},send,cancel,record,reset));
 const node=el('section',{class:'panel tutor-panel',id:'tutor'},
  el('h2',{},'Gia sư Anh–Việt'),
  el('p',{class:'muted'},'Hội thoại không được lưu; bản ghi âm xử lý tạm thời trên máy local. Giọng đọc tùy trình duyệt. Điểm phát âm chưa được đánh giá.'),
  healthNotice,retryHealth,
  el('div',{class:'tutor-shortcuts'},field('Từ trong bài muốn hỏi','tutorWord',word),
   el('div',{class:'actions'},vocabulary,grammar,conversation,writing)),
  suggestion,notice,contextNotice,log,form,audio,
  field('Câu tiếng Anh để nghe (có thể sửa)','tutorListenText',listenText),
  el('div',{class:'actions'},listen,stopSpeak));

 function controls(){
  const recording=capture?.recorder?.state==='recording',opening=!!capture&&!capture.recorder;
  const occupied=busy||recording||opening;
  send.disabled=!ready||occupied;
  record.disabled=!ready||busy||opening||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder;
  question.disabled=occupied;word.disabled=occupied;
  shortcuts.forEach(button=>button.disabled=occupied);
  cancel.hidden=!busy;
  send.title=!ready?'Đang chờ kết nối với gia sư.':occupied?'Hãy đợi hoặc dừng tác vụ hiện tại.':'';
  record.title=!ready?'Đang chờ kết nối với gia sư.':!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder?'Trình duyệt chưa hỗ trợ ghi âm; bạn vẫn có thể nhập câu hỏi.':'';
 }
 function releaseMic(session){
  clearTimeout(session.timer);session.stream?.getTracks().forEach(track=>track.stop());session.stream=null;
 }
 function stopRecording(discard=false){
  const session=capture;if(!session)return;
  session.discard=discard;
  if(discard){capture=null;releaseMic(session);}
  if(session.recorder?.state==='recording')session.recorder.stop();
 }
 function clearAudio(){
  audio.pause();audio.removeAttribute('src');audio.hidden=true;
  if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;
 }
 function addMessage(role,text){
  log.append(el('div',{class:'tutor-message '+role},el('strong',{},role==='user'?'Bạn':'Gia sư'),el('p',{},text)));
  log.scrollTop=log.scrollHeight;
 }
 function propose(text,message,focus=null){
  if(text.length>2000){status(notice,'Nội dung kèm yêu cầu vượt 2.000 ký tự. Hãy rút ngắn bản nháp rồi thử lại; bản nháp vẫn được giữ nguyên.',true);return;}
  if(question.value.trim()&&question.value!==text){
   suggestionText.value=text;suggestionFocus=focus;suggestion.hidden=false;useSuggestion.focus();
   status(notice,'Gợi ý chưa được gửi. Câu đang viết vẫn được giữ nguyên.');
  }else{
   question.value=text;focusWord=focus;suggestionFocus=null;suggestion.hidden=true;suggestionText.value='';question.focus();
   status(notice,message||'Gợi ý đã ở ô hỏi. Bạn có thể sửa rồi bấm Gửi gia sư.');
  }
 }
 vocabulary.addEventListener('click',()=>propose('Trong bài này, "'+word.value+'" nghĩa là gì? Cho ví dụ.',undefined,word.value));
 grammar.addEventListener('click',()=>propose('Giải thích mẫu câu "'+lesson.grammar.title+'" trong bài này bằng tiếng Việt. Dùng ví dụ "'+lesson.grammar.example+'" và cho một câu tương tự để tôi tự luyện.'));
 conversation.addEventListener('click',()=>propose('Luyện hội thoại tiếng Anh A1–A2 với tôi về chủ đề "'+lesson.topic+'". Mỗi lượt chỉ hỏi một câu ngắn và đợi tôi trả lời. Giải thích bằng tiếng Việt khi cần.'));
 writing.addEventListener('click',()=>{
  const draft=getDraft().trim();
  if(!draft){status(notice,'Hãy viết bản nháp ở phần luyện tập phía trên trước khi nhờ gia sư nhận xét.',true);return;}
  propose('Nhận xét đoạn luyện tập của tôi: '+draft+' Giữ câu đã đúng; không bắt chước câu ví dụ '+lesson.grammar.example);
 });
 useSuggestion.addEventListener('click',()=>{question.value=suggestionText.value;focusWord=suggestionFocus;suggestionFocus=null;suggestion.hidden=true;suggestionText.value='';question.focus();status(notice,'Bạn có thể sửa nội dung rồi bấm Gửi gia sư.');});
 keepQuestion.addEventListener('click',()=>{suggestion.hidden=true;suggestionFocus=null;suggestionText.value='';question.focus();status(notice,'Đã giữ câu đang viết.');});
 question.addEventListener('input',()=>{focusWord=null;});
 question.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();if(!send.disabled)form.requestSubmit();}
 });
 async function health(){
  if(destroyed||healthController)return;
  clearTimeout(poll);healthController=new AbortController();retryHealth.disabled=true;
  const timeout=setTimeout(()=>healthController?.abort(),5000);
  try{
   const response=await fetch('/api/health',{credentials:'omit',cache:'no-store',signal:healthController.signal});
   if(!response.ok)throw new Error();
   const data=await response.json();if(destroyed)return;ready=data.ready===true;
   status(healthNotice,ready?(data.experimental?'Gia sư thử nghiệm — chưa nghiệm thu chất lượng.':'Gia sư đã sẵn sàng.'):'Model đang tải hoặc chưa có adapter được nghiệm thu. Xem cửa sổ VS Code.');
  }catch{
   if(!destroyed){ready=false;status(healthNotice,'Chưa kết nối được gia sư. Chạy “Thử gia sư (thử nghiệm, chưa nghiệm thu)” trong VS Code và mở web ở http://127.0.0.1:8832. Trang sẽ tự kiểm tra lại.',true);}
  }finally{
   clearTimeout(timeout);healthController=null;
   if(!destroyed){retryHealth.hidden=ready;retryHealth.disabled=false;controls();poll=setTimeout(health,5000);}
  }
 }
 retryHealth.addEventListener('click',health);
 async function request(url,options){
  const operation={controller:new AbortController(),timedOut:false};activeRequest=operation;
  const timeout=setTimeout(()=>{operation.timedOut=true;operation.controller.abort();},120000);
  try{
   const response=await fetch(url,{...options,signal:operation.controller.signal,credentials:'omit'});
   let data;try{data=await response.json();}catch{throw new Error('Gia sư trả về dữ liệu không đọc được. Hãy thử lại.');}
   if(operation.controller.signal.aborted)throw new DOMException('Aborted','AbortError');
   if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Dữ liệu gửi chưa hợp lệ.');
   return data;
  }catch(error){
   if(error.name==='AbortError')throw new Error(operation.timedOut?'Hết thời gian chờ sau 2 phút. Model local có thể vẫn đang xử lý; hãy đợi rồi thử lại.':'Đã dừng chờ phản hồi. Model local có thể vẫn đang xử lý.');
   throw error;
  }finally{clearTimeout(timeout);if(activeRequest===operation)activeRequest=null;}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();const text=question.value.trim();
  if(!text||busy||!ready||capture)return;
  const turn=epoch;busy=true;suggestion.hidden=true;suggestionText.value='';controls();status(notice,'Gia sư đang trả lời…');
  try{
   const data=await request('/api/tutor/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:lesson.id,question:text,history:history.slice(-6),focus_word:focusWord})});
   if(destroyed||turn!==epoch)return;
   if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('Gia sư chưa trả lời được. Câu hỏi vẫn được giữ để bạn thử lại.');
   addMessage('user',text);addMessage('assistant',data.answer);
   const used=data.history_turns_used;
   if(Number.isInteger(used)&&used>=0&&used<=3)history=used?history.slice(-used*2):[];
   history.push({role:'user',content:text},{role:'assistant',content:data.answer});history=history.slice(-6);
   question.value='';focusWord=null;
   listenText.value=englishForListening(data.answer);
   contextNotice.textContent=data.history_trimmed?'Hội thoại dài: phản hồi vừa rồi dùng '+used+' lượt hỏi–đáp gần nhất cùng tài liệu bài. Các lượt cũ vẫn hiện nhưng không còn trong ngữ cảnh.':'Gia sư dùng tài liệu bài và tối đa 3 lượt hỏi–đáp gần nhất; các lượt cũ vẫn hiện bên dưới.';
   status(notice,data.experimental?'Đây là phản hồi thử nghiệm; hãy đối chiếu nội dung bài.':'Bạn có thể hỏi tiếp hoặc luyện câu mới.');
  }catch(error){if(!destroyed&&turn===epoch)status(notice,error.message,true);}
  finally{if(!destroyed&&turn===epoch){busy=false;controls();}}
 });
 cancel.addEventListener('click',()=>activeRequest?.controller.abort());
 reset.addEventListener('click',()=>{
  epoch++;activeRequest?.controller.abort();stopRecording(true);window.speechSynthesis?.cancel();
  busy=false;history=[];log.replaceChildren();question.value='';listenText.value='';
  suggestion.hidden=true;suggestionText.value='';focusWord=null;suggestionFocus=null;clearAudio();record.textContent='Ghi âm tiếng Anh';
  contextNotice.textContent='Gia sư dùng tài liệu bài và tối đa 3 lượt hỏi–đáp gần nhất; các lượt cũ vẫn hiện bên dưới.';
  status(notice,'Đã bắt đầu hội thoại mới.');controls();question.focus();
 });
 record.addEventListener('click',async()=>{
  if(capture?.recorder?.state==='recording'){stopRecording();return;}
  if(busy||capture||!ready)return;
  const session={epoch,stream:null,recorder:null,chunks:[],size:0,discard:false,timer:null};capture=session;controls();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});session.stream=stream;
   if(destroyed||session.discard||session.epoch!==epoch){releaseMic(session);return;}
   const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(value=>MediaRecorder.isTypeSupported(value));
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);session.recorder=recorder;
   recorder.addEventListener('dataavailable',event=>{
    if(session.discard||!event.data.size)return;
    session.size+=event.data.size;
    if(session.size>10*1024*1024){session.discard=true;stopRecording(true);record.textContent='Ghi âm tiếng Anh';status(notice,'Bản ghi vượt 10 MB. Hãy ghi đoạn ngắn hơn.',true);controls();}
    else session.chunks.push(event.data);
   });
   recorder.addEventListener('error',()=>{
    if(destroyed||session.discard||session.epoch!==epoch||capture!==session)return;
    stopRecording(true);record.textContent='Ghi âm tiếng Anh';status(notice,'Không ghi được âm thanh. Hãy nhập bằng bàn phím.',true);controls();
   });
   recorder.addEventListener('stop',async()=>{
    releaseMic(session);
    if(destroyed||session.discard||session.epoch!==epoch){session.chunks=[];return;}
    if(capture===session)capture=null;
    record.textContent='Ghi âm tiếng Anh';
    const blob=new Blob(session.chunks,{type:recorder.mimeType});session.chunks=[];
    if(!blob.size){status(notice,'Bản ghi trống. Hãy ghi lại hoặc nhập bằng bàn phím.',true);controls();return;}
    clearAudio();audioURL=URL.createObjectURL(blob);audio.src=audioURL;audio.hidden=false;
    busy=true;controls();status(notice,'Đang nhận diện lời nói; lần đầu cần tải model ASR…');
    try{
     const body=new FormData();body.append('audio',blob,'recording');
     const data=await request('/api/tutor/asr',{method:'POST',body});
     if(destroyed||session.epoch!==epoch)return;
     if(typeof data.transcript!=='string'||!data.transcript.trim())throw new Error('Không nhận ra lời nói. Hãy ghi lại hoặc nhập bằng bàn phím.');
     busy=false;controls();
     propose(data.transcript,'Kiểm tra và sửa transcript, rồi bấm Gửi gia sư.');
    }catch(error){if(!destroyed&&session.epoch===epoch)status(notice,error.message,true);}
    finally{if(!destroyed&&session.epoch===epoch){busy=false;controls();}}
   });
   recorder.start(250);record.textContent='Dừng ghi âm';status(notice,'Đang ghi âm — tối đa 30 giây.');
   session.timer=setTimeout(()=>{if(capture===session)stopRecording();},29500);controls();
  }catch{
   releaseMic(session);
   if(!destroyed&&session.epoch===epoch){capture=null;record.textContent='Ghi âm tiếng Anh';status(notice,'Không mở được micro. Kiểm tra quyền micro hoặc nhập bằng bàn phím.',true);controls();}
  }
 });
 listen.addEventListener('click',()=>{
  if(!window.speechSynthesis){status(notice,'Trình duyệt không hỗ trợ đọc giọng nói.',true);return;}
  const text=listenText.value.trim();
  if(!text){status(notice,'Nhập hoặc chọn câu tiếng Anh để nghe.',true);return;}
  const voice=speechSynthesis.getVoices().find(value=>value.lang.toLowerCase().startsWith('en'));
  if(!voice){status(notice,'Chưa có giọng tiếng Anh trên trình duyệt/thiết bị. Bạn có thể tiếp tục học bằng chữ.',true);return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=0.85;
  utterance.onerror=()=>{if(!destroyed)status(notice,'Không phát được giọng đọc. Hãy thử lại.',true);};
  speechSynthesis.speak(utterance);
 });
 stopSpeak.addEventListener('click',()=>window.speechSynthesis?.cancel());
 health();
 return {node,destroy(){
  destroyed=true;epoch++;clearTimeout(poll);healthController?.abort();activeRequest?.controller.abort();
  stopRecording(true);window.speechSynthesis?.cancel();clearAudio();history=[];
 }};
}
