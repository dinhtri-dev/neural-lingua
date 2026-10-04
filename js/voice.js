import {el, status} from './dom.js';

// Browser-only capture + Whisper. No SpeechRecognition or remote audio API.
export function createVoiceInput({record, language, onText, onStart}) {
  let alive = true, state = 'idle', worker = null, ready = false, sequence = 0;
  let stream = null, recorder = null, captureTimer = null, jobTimer = null, decoder = null;
  const notice = el('p', {id:'voiceStatus', role:'status', 'aria-live':'polite', class:'status', hidden:true});
  const cancel = el('button', {id:'cancelVoice', class:'secondary', hidden:true}, 'Hủy ghi âm / nhận diện');
  const remove = el('button', {id:'clearVoiceModel', class:'text-button'}, 'Xóa model đã lưu trong trình duyệt');
  const supported = !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.AudioContext && window.OfflineAudioContext && window.Worker && window.WebAssembly);
  const node = el('section', {'aria-label':'Nhận diện giọng nói trên thiết bị'}, notice,
    el('p', {class:'video-note'}, supported
      ? 'Bấm Chuẩn bị ghi âm để tải model khoảng 63 MB; sau đó bấm Ghi âm và cho phép micro. Mỗi lượt tối đa 30 giây. Âm thanh được nhận diện ngay trong trình duyệt, không gửi ra ngoài và không lưu. Model có thể được lưu để dùng lại; chữ nhận diện chỉ được gửi tới Google nếu bạn bấm Dịch.'
      : 'Ghi âm cần trình duyệt hiện đại hỗ trợ micro và WebAssembly, chạy trên HTTPS hoặc địa chỉ local. Bạn vẫn có thể nhập văn bản.'),
    el('div', {class:'actions'}, cancel, remove));
  remove.hidden = !window.caches;
  record.setAttribute('aria-describedby', 'voiceStatus');

  function controls() {
    const working = ['loading','opening','decoding','processing'].includes(state);
    record.disabled = !supported || working;
    record.textContent = state === 'recording' ? 'Dừng ghi âm' : working ? 'Đang xử lý…' : ready ? 'Ghi âm' : 'Chuẩn bị ghi âm';
    record.setAttribute('aria-pressed', String(state === 'recording'));
    cancel.hidden = !working && state !== 'recording';
    remove.disabled = working || state === 'recording';
  }
  function stopTracks() {
    clearTimeout(captureTimer); captureTimer = null;
    stream?.getTracks().forEach(track => track.stop()); stream = null;
  }
  function disposeWorker() {
    clearTimeout(jobTimer); jobTimer = null;
    worker?.terminate(); worker = null; ready = false;
  }
  function cancelWork(showMessage = false) {
    const wasActive = !['idle','ready'].includes(state);
    sequence++;
    if (recorder?.state === 'recording') {try {recorder.stop();} catch {}}
    recorder = null; stopTracks();
    decoder?.close().catch(() => {}); decoder = null;
    if (['loading','processing'].includes(state)) disposeWorker();
    clearTimeout(jobTimer); jobTimer = null;
    state = ready ? 'ready' : 'idle';
    if (alive) {
      controls();
      if (showMessage && wasActive) status(notice, 'Đã hủy. Micro đã tắt; bản ghi và kết quả đang chờ được bỏ.');
    }
  }
  function failure(text, resetModel = false) {
    sequence++;
    stopTracks(); recorder = null;
    clearTimeout(jobTimer); jobTimer = null;
    if (resetModel) disposeWorker();
    state = ready ? 'ready' : 'idle';
    if (alive) {controls(); status(notice, text, true);}
  }
  function deadline(id, phase) {
    clearTimeout(jobTimer);
    jobTimer = setTimeout(() => {
      if (!alive || id !== sequence) return;
      sequence++;
      failure(phase === 'loading' ? 'Chuẩn bị model quá lâu. Hãy kiểm tra kết nối và bấm thử lại.' : 'Nhận diện quá lâu trên máy này. Hãy thử ghi đoạn ngắn hơn.', true);
    }, phase === 'loading' ? 180000 : 120000);
  }
  function makeWorker() {
    const current = new Worker(new URL('./voice-worker.js', import.meta.url), {type:'module'});
    worker = current;
    current.addEventListener('message', ({data}) => {
      if (!alive || worker !== current || !data || data.id !== sequence) return;
      if (data.type === 'progress') {
        if (Number.isFinite(data.percent)) status(notice, `Đang chuẩn bị model… ${Math.max(0, Math.min(100, data.percent))}% của tệp hiện tại. Micro chưa bật.`);
        return;
      }
      clearTimeout(jobTimer); jobTimer = null;
      if (data.type === 'ready') {
        ready = true; state = 'ready'; controls();
        status(notice, 'Model đã sẵn sàng. Bấm Ghi âm, nói rõ rồi bấm Dừng ghi âm.');
      } else if (data.type === 'result' && typeof data.text === 'string' && data.text.length <= 5000) {
        state = 'ready'; controls(); const feedback = onText(data.text);
        status(notice, feedback || 'Đã thêm lời nói vào ô nhập. Kiểm tra nội dung rồi bấm Dịch; model có thể nhận sai.');
      } else if (data.type === 'empty') {
        state = 'ready'; controls();
        status(notice, 'Chưa nghe rõ lời nói. Hãy nói gần micro và thử lại.', true);
      } else if (data.type === 'error') {
        failure(data.phase === 'prepare'
          ? 'Không tải được model ghi âm. Kiểm tra kết nối; nếu chạy bản local, cần chuẩn bị bộ model theo hướng dẫn ghi âm.'
          : 'Không nhận diện được bản ghi. Hãy thử đoạn ngắn hơn hoặc nhập bằng chữ.', true);
      }
    });
    current.addEventListener('error', event => {
      event.preventDefault();
      if (alive && worker === current) failure('Không mở được bộ nhận diện trên thiết bị. Kiểm tra bộ model và thử lại hoặc nhập bằng chữ.', true);
    });
    return current;
  }
  function prepare() {
    const id = ++sequence;
    state = 'loading'; controls();
    status(notice, 'Đang chuẩn bị model trên thiết bị… Micro chưa bật. Bạn có thể hủy.');
    try {makeWorker().postMessage({id, type:'prepare'}); deadline(id, 'loading');}
    catch {failure('Trình duyệt không mở được bộ nhận diện. Bạn có thể nhập bằng chữ.', true);}
  }
  async function toAudio(blob, id) {
    if (!blob.size || blob.size > 10 * 1024 * 1024) throw new Error('Invalid recording');
    const context = new AudioContext(); decoder = context;
    let decoded;
    try {decoded = await context.decodeAudioData(await blob.arrayBuffer());}
    finally {await context.close().catch(() => {}); if (decoder === context) decoder = null;}
    if (!alive || id !== sequence) return null;
    if (!Number.isFinite(decoded.duration) || decoded.duration < 0.1 || decoded.duration > 30.5) throw new Error('Invalid duration');
    // Browser audio decoding/resampling, independent of recording MIME/codec.
    const length = Math.min(480000, Math.round(decoded.duration * 16000));
    const offline = new OfflineAudioContext(1, length, 16000);
    const source = offline.createBufferSource(); source.buffer = decoded;
    source.connect(offline.destination); source.start();
    const rendered = await offline.startRendering();
    return new Float32Array(rendered.getChannelData(0));
  }
  function stopRecording() {
    if (state !== 'recording') return;
    state = 'decoding'; controls();
    status(notice, 'Micro đã tắt. Đang đọc bản ghi trên thiết bị…');
    clearTimeout(captureTimer);
    try {recorder.stop();} catch {failure('Không kết thúc được bản ghi. Hãy thử lại.');}
    stopTracks();
  }
  async function startRecording() {
    if (onStart() === false) return;
    const id = ++sequence, selectedLanguage = language();
    state = 'opening'; controls();
    status(notice, 'Hãy cho phép dùng micro. Bạn có thể hủy nếu chưa muốn ghi.');
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true}, video:false});
      if (!alive || id !== sequence) {acquired.getTracks().forEach(track => track.stop()); return;}
      stream = acquired;
      const mime = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(value => MediaRecorder.isTypeSupported(value));
      const current = new MediaRecorder(acquired, mime ? {mimeType:mime} : undefined);
      recorder = current;
      let chunks = [], size = 0, recordingError = false;
      current.addEventListener('dataavailable', event => {
        if (!alive || id !== sequence || recordingError || !event.data.size) return;
        size += event.data.size;
        if (size > 10 * 1024 * 1024) {recordingError = true; cancelWork(); status(notice, 'Bản ghi vượt 10 MB. Hãy ghi đoạn ngắn hơn.', true);}
        else chunks.push(event.data);
      });
      current.addEventListener('error', () => {
        recordingError = true; chunks = [];
        if (alive && id === sequence) {cancelWork(); status(notice, 'Không ghi được âm thanh. Hãy thử lại hoặc nhập bằng chữ.', true);}
      });
      current.addEventListener('stop', async () => {
        if (!alive || id !== sequence || recordingError) {chunks = []; return;}
        stopTracks(); recorder = null;
        // A device can stop on its own, without the stop button.
        state = 'decoding'; controls();
        try {
          const audio = await toAudio(new Blob(chunks, {type:current.mimeType}), id); chunks = [];
          if (!alive || id !== sequence || !audio) return;
          state = 'processing'; controls();
          status(notice, 'Đang nhận diện ngay trên máy… Micro đã tắt. Bạn có thể hủy.');
          worker.postMessage({id, type:'transcribe', language:selectedLanguage, audio}, [audio.buffer]);
          deadline(id, 'processing');
        } catch {
          chunks = [];
          if (alive && id === sequence) failure('Bản ghi quá ngắn, quá dài hoặc không đọc được. Hãy thử ghi lại.');
        }
      });
      current.start(250); state = 'recording'; controls();
      status(notice, 'Đang ghi âm — tối đa 30 giây. Bấm Dừng ghi âm khi nói xong.');
      captureTimer = setTimeout(stopRecording, 29500);
    } catch (error) {
      if (!alive || id !== sequence) return;
      const errors = {
        NotAllowedError:'Bạn chưa cho phép dùng micro. Mở quyền micro của trang này rồi thử lại.',
        NotFoundError:'Không tìm thấy micro. Kiểm tra thiết bị rồi thử lại.',
        NotReadableError:'Không mở được micro. Kiểm tra micro có đang bị ứng dụng khác dùng không.',
      };
      failure(errors[error.name] || 'Không mở được micro. Kiểm tra quyền của trang hoặc nhập bằng chữ.');
    }
  }
  record.addEventListener('click', () => {
    if (!supported) return;
    if (state === 'recording') stopRecording();
    else if (state === 'idle') prepare();
    else if (state === 'ready') startRecording();
  });
  cancel.addEventListener('click', () => cancelWork(true));
  remove.addEventListener('click', async () => {
    cancelWork(); disposeWorker(); state = 'idle'; controls(); remove.disabled = true;
    try {
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          const url = new URL(request.url);
          const modelRoot = new URL('../voice-assets/models/', import.meta.url);
          if (url.origin === modelRoot.origin && url.pathname.startsWith(modelRoot.pathname)) await cache.delete(request);
        }
      }
      if (alive) status(notice, 'Đã xóa model lưu trong trình duyệt. Lần sau cần chuẩn bị lại; âm thanh không được lưu.');
    } catch {if (alive) status(notice, 'Không xóa được bộ nhớ model. Bạn có thể xóa dữ liệu trang trong cài đặt trình duyệt.', true);}
    finally {if (alive) controls();}
  });
  controls();
  return {node, cancel:cancelWork, destroy(){alive = false; cancelWork(); disposeWorker();}};
}
