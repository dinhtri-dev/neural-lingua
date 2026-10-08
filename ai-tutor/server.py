"""Local-only tutor API. No accounts, persistent chats, or training on uploads."""
import argparse
import asyncio
from collections import deque
from contextlib import asynccontextmanager
import io
import os
from pathlib import Path, PurePosixPath
import threading
import time
import math

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from common import ROOT, SYSTEM, WEB_ROOT, config, course, digest, fingerprint, latest_run, lesson_context, read_json

class LocalRequestBudget:
    """App-wide budgets for this loopback-only, single-worker server."""
    limits={'/api/tutor/chat':12,'/api/tutor/asr':6}
    window=60

    def __init__(self, clock=time.monotonic):
        self.clock=clock
        self.requests={path:deque() for path in self.limits}

    def retry_after(self, path):
        if path not in self.limits: return 0
        now=self.clock(); recent=self.requests[path]
        while recent and recent[0]<=now-self.window: recent.popleft()
        if len(recent)>=self.limits[path]:
            return max(1,math.ceil(self.window-(now-recent[0])))
        recent.append(now)
        return 0

class Message(BaseModel):
    model_config = ConfigDict(extra='forbid')
    role: str
    content: str = Field(min_length=1, max_length=2000)

    @field_validator('role')
    @classmethod
    def allowed_role(cls, value):
        if value not in {'user','assistant'}:
            raise ValueError('Chỉ nhận user hoặc assistant trong lịch sử.')
        return value

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    lesson_id: str = Field(min_length=1,max_length=40)
    question: str = Field(min_length=1,max_length=2000)
    history: list[Message] = Field(default_factory=list,max_length=6)
    focus_word: str | None = Field(default=None,min_length=1,max_length=80)

    @field_validator('question')
    @classmethod
    def nonempty(cls,value):
        if not value.strip(): raise ValueError('Câu hỏi trống.')
        return value.strip()

def fit_chat_context(messages, count_tokens, max_tokens):
    """Keep the lesson and latest question intact; drop only complete old turns."""
    fitted=list(messages)
    while count_tokens(fitted)>max_tokens:
        if len(fitted)<=2:
            raise ValueError('Câu hỏi và tài liệu bài vượt giới hạn xử lý. Hãy rút ngắn câu hỏi; nội dung chưa được gửi tới model.')
        fitted=fitted[:1]+fitted[3:]
    return fitted

class Runtime:
    def __init__(self, directory=None, experimental=False):
        self.directory=directory; self.experimental=experimental
        self.ready=False; self.status='loading'; self.version='unloaded'
        self.model=None; self.tokenizer=None; self.asr=None
        self.lock=threading.Lock()

    def load(self):
        try:
            directory=latest_run(self.directory,full_only=not self.experimental)
            record=read_json(directory/'run.json')
            if record['status']!='completed' or record['fingerprint']!=fingerprint():
                raise ValueError('Lượt train chưa hoàn tất hoặc dữ liệu/cấu hình khác phiên bản.')
            if not self.experimental:
                approval=read_json(directory/'approval.json')
                if not (approval['status']=='approved' and approval['fingerprint']==fingerprint()):
                    raise ValueError('Điều kiện kiểm tra dữ liệu/model không đạt.')
                if not (approval['review_sha256']==digest(directory/'evaluation/review.csv')):
                    raise ValueError('Điều kiện kiểm tra dữ liệu/model không đạt.')
                if not (approval['answers_sha256']==digest(directory/'evaluation/answers.json')):
                    raise ValueError('Điều kiện kiểm tra dữ liệu/model không đạt.')
                if not (approval['adapter_sha256']==digest(directory/'adapter/adapter_model.safetensors')):
                    raise ValueError('Điều kiện kiểm tra dữ liệu/model không đạt.')
            from pipeline import load_base, preflight
            from peft import PeftModel
            model,self.tokenizer=load_base(preflight())
            self.model=PeftModel.from_pretrained(model,directory/'adapter')
            self.version=directory.name
            self.status='experimental' if self.experimental else 'approved'
            self.ready=True
        except Exception as error:
            self.status='unavailable: chạy train và nghiệm thu, hoặc chọn Thử gia sư (thử nghiệm). Xem README.'
            print(f'Không nạp được gia sư ({type(error).__name__}). Kiểm tra đường dẫn run và approval.json.',flush=True)

    def chat(self, messages):
        from pipeline import generate
        with self.lock:
            return generate(self.model,self.tokenizer,messages)

    def count_tokens(self, messages):
        return len(self.tokenizer.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,enable_thinking=False,return_dict=False))

    def transcribe(self, audio):
        # Decode from memory using FFmpeg/PyAV: never use supplied filenames.
        import av
        from faster_whisper import WhisperModel
        import numpy as np
        try:
            chunks=[]; samples=0
            with av.open(io.BytesIO(audio),mode='r',metadata_errors='ignore') as container:
                if not container.streams.audio:
                    raise ValueError('Không có luồng âm thanh.')
                resampler=av.AudioResampler(format='s16',layout='mono',rate=16000)
                for frame in container.decode(audio=0):
                    for part in resampler.resample(frame):
                        values=part.to_ndarray().flatten(); samples+=len(values)
                        if samples>30*16000:
                            raise ValueError('Bản ghi vượt 30 giây.')
                        chunks.append(values)
                for part in resampler.resample(None):
                    values=part.to_ndarray().flatten(); samples+=len(values)
                    if samples>30*16000: raise ValueError('Bản ghi vượt 30 giây.')
                    chunks.append(values)
            waveform=np.concatenate(chunks).astype(np.float32)/32768.0 if chunks else np.array([],dtype=np.float32)
        except ValueError as error:
            if str(error) in {'Không có luồng âm thanh.','Bản ghi vượt 30 giây.'}:
                raise
            raise ValueError('Không đọc được nội dung âm thanh. Dùng WebM, WAV, OGG hoặc MP4 hợp lệ.') from error
        except Exception as error:
            raise ValueError('Không đọc được nội dung âm thanh. Dùng WebM, WAV, OGG hoặc MP4 hợp lệ.') from error
        if not 0 < len(waveform) <= 30*16000:
            raise ValueError('Bản ghi phải dài từ hơn 0 đến tối đa 30 giây.')
        if not np.isfinite(waveform).all() or float(np.sqrt(np.mean(waveform**2)))<0.0001:
            raise ValueError('Không nghe thấy lời nói. Kiểm tra micro rồi ghi lại.')
        with self.lock:
            if self.asr is None:
                self.asr=WhisperModel('small.en',device='cpu',compute_type='int8',download_root=str(ROOT/'.cache/asr'),cpu_threads=4,num_workers=1)
            segments,_=self.asr.transcribe(waveform,language='en',vad_filter=True,beam_size=1)
            text=' '.join(s.text.strip() for s in segments).strip()
        if not text:
            raise ValueError('Không nhận ra lời nói. Bạn có thể nhập câu bằng bàn phím.')
        return text[:2000]

def create_app(runtime=None, port=None, load_runtime=True):
    runtime=runtime or Runtime(); port=port or config()['port']
    lessons={l['id']:l for l in course()['lessons']}
    hosts={f'127.0.0.1:{port}',f'localhost:{port}'}
    origins={f'http://{host}' for host in hosts}
    worker=None
    @asynccontextmanager
    async def lifespan(app):
        if load_runtime:
            worker=asyncio.create_task(asyncio.to_thread(runtime.load))
        yield
        if load_runtime and not worker.done(): worker.cancel()
    app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None,lifespan=lifespan)
    app.state.runtime=runtime
    app.state.gate=asyncio.Semaphore(1)
    app.state.request_budget=LocalRequestBudget()

    def secure(response):
        response.headers.update({
            'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' https://translate.googleapis.com; frame-src https://learningenglish.voanews.com; img-src 'self'; media-src 'self' blob:; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'",
            'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Cache-Control':'no-store',
        })
        return response

    @app.middleware('http')
    async def boundary(request: Request, call_next):
        if request.headers.get('host','').lower() not in hosts:
            return secure(JSONResponse({'detail':'Host không hợp lệ.'},status_code=403))
        if request.method=='POST':
            if request.headers.get('origin') not in origins:
                return secure(JSONResponse({'detail':'Chỉ nhận yêu cầu từ trang local cùng origin.'},status_code=403))
            retry=app.state.request_budget.retry_after(request.scope['path'])
            if retry:
                return secure(JSONResponse({'detail':'Đã đạt giới hạn yêu cầu trong một phút. Hãy đợi rồi thử lại.'},status_code=429,headers={'Retry-After':str(retry)}))
            limit=10*1024*1024+65536 if request.scope['path']=='/api/tutor/asr' else 20000
            chunks=[]; size=0
            async for chunk in request.stream():
                size+=len(chunk)
                if size>limit:
                    return secure(JSONResponse({'detail':'Yêu cầu quá lớn.'},status_code=413))
                chunks.append(chunk)
            request._body=b''.join(chunks)
        response=await call_next(request)
        return secure(response)

    @app.exception_handler(Exception)
    async def generic_error(request,error):
        return secure(JSONResponse({'detail':'Không xử lý được yêu cầu. Hãy thử lại hoặc dùng phần học bằng chữ.'},status_code=500))

    @app.get('/api/health')
    def health():
        return {'ready':runtime.ready,'status':runtime.status,'model_version':runtime.version,'experimental':runtime.experimental}

    @app.post('/api/tutor/chat')
    async def chat(body:ChatRequest):
        if body.lesson_id not in lessons: raise HTTPException(422,'ID bài không hợp lệ.')
        if not runtime.ready: raise HTTPException(503,'Gia sư chưa sẵn sàng. Xem trạng thái model.')
        lesson=lessons[body.lesson_id]
        words=None
        if body.focus_word is not None:
            words=[word for word in lesson['vocabulary'] if word['word']==body.focus_word]
            if not words: raise HTTPException(422,'Từ được chọn không nằm trong bài hiện tại.')
        messages=[{'role':'system','content':SYSTEM+'\nTÀI LIỆU BÀI:\n'+lesson_context(lesson,words=words)}]
        history=[m.model_dump() for m in body.history]
        if history and (len(history)%2 or [m['role'] for m in history]!=['user','assistant']*(len(history)//2)):
            raise HTTPException(422,'Lịch sử phải gồm các cặp user/assistant.')
        messages+=history+[{'role':'user','content':body.question}]
        if app.state.gate.locked() or getattr(runtime,'lock',None) and runtime.lock.locked(): raise HTTPException(429,'Gia sư đang xử lý một yêu cầu khác; hãy đợi rồi thử lại.')
        async with app.state.gate:
            try:
                fitted=fit_chat_context(messages,runtime.count_tokens,config()['inference_max_input_tokens'])
                answer=await asyncio.to_thread(runtime.chat,fitted)
                if not isinstance(answer,str) or not answer.strip():
                    raise RuntimeError('Empty model response')
            except ValueError as error: raise HTTPException(422,str(error)) from error
            except Exception as error: raise HTTPException(503,'Model tạm thời không trả lời được. Hãy thử lại với câu ngắn hơn.') from error
        return {'answer':answer,'lesson_id':body.lesson_id,'model_version':runtime.version,'experimental':runtime.experimental,
                'history_turns_used':(len(fitted)-2)//2,'history_trimmed':len(fitted)<len(messages)}

    @app.post('/api/tutor/asr')
    async def asr(audio:UploadFile=File(...)):
        try:
            data=await audio.read(10*1024*1024+1)
            if len(data)>10*1024*1024: raise HTTPException(413,'Bản ghi vượt 10 MB.')
            if app.state.gate.locked() or getattr(runtime,'lock',None) and runtime.lock.locked(): raise HTTPException(429,'Đang xử lý yêu cầu khác; hãy đợi rồi thử lại.')
            async with app.state.gate:
                try: text=await asyncio.to_thread(runtime.transcribe,data)
                except ValueError as error: raise HTTPException(422,str(error)) from error
                except Exception as error: raise HTTPException(503,'Chưa tải được model nhận diện giọng nói hoặc xử lý thất bại. Hãy nhập bằng chữ.') from error
            return {'transcript':text,'language':'en','pronunciation_assessed':False}
        finally:
            await audio.close()

    @app.get('/{path:path}')
    def static(path):
        path=path or 'index.html'
        allowed=(path in {'index.html','styles.css'} or path.startswith('js/') and path.endswith('.js') or path.startswith('data/') and path.endswith('.json'))
        if not allowed or '\\' in path or any(p.startswith('.') for p in PurePosixPath(path).parts):
            raise HTTPException(404,'Không tìm thấy.')
        target=(WEB_ROOT/path).resolve()
        if not target.is_relative_to(WEB_ROOT) or target.relative_to(WEB_ROOT).as_posix()!=path or not target.is_file():
            raise HTTPException(404,'Không tìm thấy.')
        return FileResponse(target)
    return app

if __name__=='__main__':
    import uvicorn
    parser=argparse.ArgumentParser(); parser.add_argument('--run-dir'); parser.add_argument('--experimental',action='store_true'); args=parser.parse_args()
    port=config()['port']
    print(f'Mở http://127.0.0.1:{port}; model tải nền. Ctrl+C để dừng.',flush=True)
    uvicorn.run(create_app(Runtime(args.run_dir,args.experimental)),host='127.0.0.1',port=port,access_log=False,log_level='warning')
