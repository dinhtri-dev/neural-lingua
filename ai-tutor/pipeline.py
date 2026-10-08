"""QLoRA training, reproducible evaluation, and checkpoint safeguards."""
import argparse
import contextlib
from datetime import datetime
import gc
import importlib.metadata
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import uuid

from common import ROOT, SYSTEM, config, course, digest, fingerprint, latest_run, lesson_context, read_json, validate_data, write_json

os.environ.setdefault('HF_HOME', str(ROOT / '.cache/huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')

def preflight():
    import torch
    import bitsandbytes as bnb
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA không khả dụng. Kiểm tra driver NVIDIA và môi trường .venv; không train CPU.')
    props = torch.cuda.get_device_properties(0)
    free, total = torch.cuda.mem_get_info()
    print(f'GPU: {props.name}; VRAM trống {free / 2**30:.2f}/{total / 2**30:.2f} GB', flush=True)
    if free < 3.5 * 2**30:
        raise RuntimeError('VRAM trống dưới 3,5 GB. Dừng phiên train/gia sư khác bằng Shift+F5 hoặc Ctrl+C rồi chạy lại. GPU 0% vẫn có thể đang giữ model trong VRAM.')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    layer = bnb.nn.Linear4bit(64, 64, bias=False, compute_dtype=dtype, quant_type='nf4').cuda()
    output = layer(torch.ones(1, 64, device='cuda', dtype=dtype))
    assert torch.isfinite(output).all(), 'Phép tính 4-bit thất bại.'
    del layer, output
    gc.collect(); torch.cuda.empty_cache()
    return dtype

def load_base(dtype):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    cfg = config()
    tokenizer = AutoTokenizer.from_pretrained(cfg['model_id'], revision=cfg['model_revision'], trust_remote_code=False)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = 'right'
    model = AutoModelForCausalLM.from_pretrained(
        cfg['model_id'], revision=cfg['model_revision'],
        trust_remote_code=False, use_safetensors=True,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=dtype),
        device_map={'': 0}, dtype=dtype, attn_implementation='sdpa',
    )
    return model, tokenizer

def encode_row(row, tokenizer):
    # Explicit target boundaries avoid depending on a tokenizer's optional
    # {% generation %} masks. Only the final assistant response is supervised.
    prompt = tokenizer.apply_chat_template(row['messages'][:-1], tokenize=True, add_generation_prompt=True, enable_thinking=False, return_dict=False)
    answer = tokenizer.encode(row['messages'][-1]['content'] + '<|im_end|>', add_special_tokens=False)
    ids = prompt + answer
    return {'input_ids': ids, 'completion_mask': [0] * len(prompt) + [1] * len(answer)}

def encoded_data(splits, tokenizer):
    from datasets import Dataset
    result = {}
    too_long = []
    lengths = {}
    for name, rows in splits.items():
        encoded = [encode_row(r, tokenizer) for r in rows]
        for row, item in zip(rows, encoded, strict=True):
            if len(item['input_ids']) > config()['max_length']:
                too_long.append({'id': row['id'], 'tokens': len(item['input_ids'])})
        lengths[name] = {'max': max(len(x['input_ids']) for x in encoded), 'count': len(rows)}
        result[name] = Dataset.from_list(encoded)
    write_json(ROOT / 'data/token-audit.json', {'model_revision': config()['model_revision'], 'lengths': lengths, 'over_limit': too_long})
    if too_long:
        raise ValueError(f'{len(too_long)} mẫu vượt 512 token. Xem data/token-audit.json; sửa dữ liệu rồi rà soát lại, không cắt đáp án tự động.')
    return result

def verify_mask(dataset, tokenizer):
    import torch
    from trl.trainer.sft_trainer import DataCollatorForLanguageModeling
    collator = DataCollatorForLanguageModeling(tokenizer.pad_token_id, completion_only_loss=True)
    items = [dataset[i] for i in range(min(2, len(dataset)))]
    batch = collator(items)
    for i, item in enumerate(items):
        mask = torch.tensor(item['completion_mask'], dtype=torch.bool)
        length = len(mask)
        assert (batch['labels'][i,:length][~mask] == -100).all()
        assert torch.equal(batch['labels'][i,:length][mask], batch['input_ids'][i,:length][mask])
        assert (batch['labels'][i,length:] == -100).all()
        assert item['input_ids'][-1] == tokenizer.convert_tokens_to_ids('<|im_end|>')
        assert mask.any()
    return collator

def trainer_for(model, tokenizer, data, directory, smoke=False):
    import torch
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTConfig, SFTTrainer
    cfg = config()
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)
    model.config.use_cache = False
    model = get_peft_model(model, LoraConfig(r=cfg['lora_r'], lora_alpha=cfg['lora_alpha'], lora_dropout=cfg['lora_dropout'], target_modules='all-linear', task_type='CAUSAL_LM', bias='none'))
    model.print_trainable_parameters()
    collator = verify_mask(data['train'], tokenizer)
    args = SFTConfig(
        output_dir=str(directory / 'checkpoints'),
        max_length=cfg['max_length'], per_device_train_batch_size=cfg['batch_size'], per_device_eval_batch_size=1,
        gradient_accumulation_steps=1 if smoke else cfg['gradient_accumulation_steps'],
        num_train_epochs=cfg['epochs'], max_steps=10 if smoke else -1,
        learning_rate=cfg['learning_rate'], warmup_steps=0.05,
        lr_scheduler_type='cosine', weight_decay=0.01, max_grad_norm=1.0,
        bf16=torch.cuda.is_bf16_supported(), fp16=not torch.cuda.is_bf16_supported(),
        gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant': False},
        optim='adamw_torch', packing=False, padding_free=False,
        completion_only_loss=True, dataset_kwargs={'skip_prepare_dataset': True},
        eval_strategy='no' if smoke else 'epoch', save_strategy='steps' if smoke else 'epoch',
        save_steps=5, save_total_limit=2, load_best_model_at_end=not smoke,
        metric_for_best_model='eval_loss', greater_is_better=False,
        logging_steps=1 if smoke else 5, logging_nan_inf_filter=False, report_to='none', push_to_hub=False,
        dataloader_num_workers=0, dataset_num_proc=1, seed=cfg['seed'], data_seed=cfg['seed'],
        remove_unused_columns=False, eos_token='<|im_end|>', torch_compile=False,
    )
    return SFTTrainer(model=model, args=args, train_dataset=data['train'], eval_dataset=None if smoke else data['validation'], processing_class=tokenizer, data_collator=collator)

def generate(model, tokenizer, messages, max_tokens=None):
    import torch
    cfg = config()
    ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, enable_thinking=False, return_tensors='pt', return_dict=False).to('cuda')
    if ids.shape[-1] > cfg['inference_max_input_tokens']:
        raise ValueError('Hội thoại quá dài. Hãy bắt đầu cuộc hội thoại mới hoặc rút ngắn câu hỏi.')
    model.eval()
    with torch.inference_mode():
        output = model.generate(ids, attention_mask=torch.ones_like(ids), max_new_tokens=max_tokens or cfg['max_new_tokens'], do_sample=False, repetition_penalty=1.05, use_cache=True, disable_compile=True, pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.convert_tokens_to_ids('<|im_end|>'))
    return tokenizer.decode(output[0,ids.shape[-1]:], skip_special_tokens=True).strip()

def new_run(mode):
    directory = ROOT / 'runs' / (datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + mode + '-' + uuid.uuid4().hex[:6])
    directory.mkdir(parents=True)
    write_json(directory / 'run.json', {'mode': mode, 'status': 'started', 'fingerprint': fingerprint(), 'config': config(), 'data': read_json(ROOT / 'data/manifest.json'), 'started_at': datetime.now().isoformat(), 'quality_status': 'experimental'})
    (directory / 'dependencies.lock.txt').write_text(subprocess.check_output([sys.executable, '-m', 'pip', 'freeze'], text=True), encoding='utf-8')
    return directory

def update_run(directory, **changes):
    record = read_json(directory / 'run.json'); record.update(changes); write_json(directory / 'run.json', record)

def checkpoint_for(directory):
    record = read_json(directory / 'run.json')
    if record['fingerprint'] != fingerprint():
        raise ValueError('Model, cấu hình hoặc dữ liệu đã thay đổi; không được tiếp tục checkpoint này.')
    candidates = [p for p in (directory / 'checkpoints').glob('checkpoint-*') if (p / 'trainer_state.json').exists() and (p / 'optimizer.pt').exists()]
    if not candidates:
        raise ValueError('Không tìm thấy checkpoint có optimizer để tiếp tục.')
    return max(candidates, key=lambda p: int(p.name.split('-')[-1]))

def train_once(smoke=False, resume=None):
    import torch
    from transformers import set_seed
    splits = validate_data()
    dtype = preflight(); set_seed(config()['seed'])
    directory = resume or new_run('smoke' if smoke else 'train')
    checkpoint = checkpoint_for(directory) if resume else None
    print('Đang nạp model Qwen3-1.7B…', flush=True)
    model, tokenizer = load_base(dtype)
    data = encoded_data(splits, tokenizer)
    trainer = trainer_for(model, tokenizer, data, directory, smoke)
    weights = {n:p.detach().cpu().clone() for n,p in trainer.model.named_parameters() if p.requires_grad}
    torch.cuda.reset_peak_memory_stats(); start = time.monotonic()
    try:
        result = trainer.train(resume_from_checkpoint=str(checkpoint) if checkpoint else None)
        if not math.isfinite(result.training_loss):
            raise RuntimeError('Loss không hữu hạn; model chưa hợp lệ.')
        changed = any(not torch.equal(weights[n],p.detach().cpu()) for n,p in trainer.model.named_parameters() if p.requires_grad)
        if not changed:
            raise RuntimeError('Adapter không thay đổi sau train.')
        if any(not torch.isfinite(p).all() for p in trainer.model.parameters() if p.requires_grad):
            raise RuntimeError('Trọng số adapter có NaN/Inf; không xuất model.')
        adapter = directory / 'adapter'; trainer.model.save_pretrained(adapter, safe_serialization=True); tokenizer.save_pretrained(adapter)
        update_run(directory, status='completed', elapsed_seconds=round(time.monotonic()-start,2), training_loss=result.training_loss, adapter_changed=changed, peak_vram_gb=round(torch.cuda.max_memory_allocated()/2**30,3), global_step=trainer.state.global_step)
        # Release trainer and base model before testing the saved adapter.
        del trainer, model, data, weights
        gc.collect(); torch.cuda.empty_cache()
        from peft import PeftModel
        model, tokenizer = load_base(dtype)
        model = PeftModel.from_pretrained(model, adapter)
        sample = generate(model, tokenizer, [{'role':'system','content':SYSTEM},{'role':'user','content':'Sửa câu: She go to school every day.'}], 96)
        assert sample, 'Adapter nạp lại không sinh được câu trả lời.'
        write_json(directory / 'reload-test.json', {'prompt':'Sửa câu: She go to school every day.', 'answer':sample, 'note':'Kiểm tra lưu/nạp và sinh văn bản, không phải nghiệm thu chất lượng.'})
        print(f'Đã lưu: {directory}\nAdapter đã thay đổi; lưu/nạp lại thành công.\nCâu trả lời thử: {sample}', flush=True)
    except Exception as error:
        update_run(directory, status='failed', error_type=type(error).__name__)
        if isinstance(error, torch.cuda.OutOfMemoryError):
            raise RuntimeError('Hết VRAM. Đóng chương trình dùng GPU rồi chạy lại; bộ train không tự cắt dữ liệu hoặc đổi model.') from error
        raise
    finally:
        # The reload check also owns a GPU model. Clear every reference before
        # returning, including on failure; empty_cache alone cannot free tensors.
        trainer = model = data = weights = None
        gc.collect()
        torch.cuda.empty_cache()
    return directory

def evaluate(directory, limit=None):
    from peft import PeftModel
    splits = validate_data()
    if read_json(directory / 'run.json')['fingerprint'] != fingerprint():
        raise ValueError('Phiên bản dữ liệu/cấu hình khác lượt train; không đánh giá bằng phiên bản mới.')
    dtype = preflight(); model, tokenizer = load_base(dtype)
    model = PeftModel.from_pretrained(model, directory / 'adapter')
    if limit is not None and not 1 <= limit <= 52:
        raise ValueError('Giới hạn kiểm tra phải từ 1 đến 52.')
    target = directory / ('evaluation-preview' if limit is not None else 'evaluation'); target.mkdir(exist_ok=True)
    results = []
    rows = splits['test'] if limit is None else splits['test'][:limit]
    for i, row in enumerate(rows,1):
        context_messages = row['messages'][:-1]
        plain = [{'role':'system','content':SYSTEM}] + context_messages[1:]
        with model.disable_adapter():
            no_context = generate(model,tokenizer,plain)
            with_context = generate(model,tokenizer,context_messages)
        tuned = generate(model,tokenizer,context_messages)
        results.append({'id':row['id'],'lesson_id':row['lesson_id'],'question':context_messages[-1]['content'],'reference':row['messages'][-1]['content'],'base':no_context,'base_with_context':with_context,'adapter_with_context':tuned})
        print(f'Đánh giá {i}/{len(rows)}',flush=True)
        write_json(target / 'answers.json',results)
    # Deliberately no LLM self-grading or answer-string matching as a correctness certificate.
    import csv
    with (target / 'review.csv').open('w',encoding='utf-8-sig',newline='') as handle:
        writer=csv.writer(handle)
        writer.writerow(['id','variant','knowledge_correct','a1_a2_fit','vietnamese_explanation','preserves_intent','lesson_grounded','severe_error','note'])
        for row in results:
            for variant in ['base','base_with_context','adapter_with_context']:
                writer.writerow([row['id'],variant,'','','','','','',''])
    write_json(target / 'summary.json',{'status':'partial_preview' if limit is not None else 'awaiting_human_review','cases':len(results),'required_accuracy':0.9,'rule':'Review all variants. Correctness >=90%, no severe errors, and improvement over base_with_context. Validation loss is not quality certification.'})
    print(f'Kết quả so sánh: {target}. Điền review.csv rồi chạy approve_review.py; không tự chứng nhận chất lượng.',flush=True)

def isolated_stage(mode, directory=None, limit=None):
    """Process exit releases all CUDA state, even when a debugger holds frames."""
    (ROOT / 'runs').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.stage-', dir=ROOT / 'runs') as temporary:
        receipt = Path(temporary) / 'result.json'
        command = [sys.executable, str(ROOT / 'pipeline.py'), mode, '--worker', '--result-file', str(receipt)]
        if directory is not None:
            command += ['--run-dir', str(directory)]
        if limit is not None:
            command += ['--limit', str(limit)]
        print(f'Bắt đầu giai đoạn {mode} trong tiến trình riêng; trả VRAM khi giai đoạn kết thúc.', flush=True)
        process = subprocess.Popen(command, cwd=ROOT)
        try:
            returncode = process.wait()
        except BaseException:
            if process.poll() is None:
                if os.name == 'nt':
                    # A Windows venv launcher owns a second Python process.
                    # Terminate only our freshly started worker and its children.
                    subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    process.terminate()
                process.wait()
            raise
        if returncode:
            raise subprocess.CalledProcessError(returncode, command)
        result = read_json(receipt)
        return Path(result['run_dir']) if result['run_dir'] else None


def orchestrate(mode, directory=None, limit=None):
    # This coordinator deliberately never loads torch or a CUDA model.
    if mode == 'train':
        isolated_stage('smoke')
        trained = isolated_stage('train')
        isolated_stage('evaluate', trained)
    elif mode == 'resume':
        trained = isolated_stage('resume', directory)
        isolated_stage('evaluate', trained)
    else:
        isolated_stage(mode, directory, limit)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('mode',choices=['train','smoke','resume','evaluate'])
    parser.add_argument('--run-dir'); parser.add_argument('--experimental',action='store_true')
    parser.add_argument('--limit',type=int,help='Chỉ kiểm tra thử một số ca; không dùng để nghiệm thu')
    parser.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--result-file', help=argparse.SUPPRESS)
    args=parser.parse_args()
    if not args.worker:
        orchestrate(args.mode, args.run_dir, args.limit)
        return
    directory = None
    if args.mode=='smoke': directory=train_once(smoke=True)
    elif args.mode=='train':
        directory=train_once()
    elif args.mode=='resume':
        directory=latest_run(args.run_dir,full_only=True)
        train_once(resume=directory)
    else: evaluate(latest_run(args.run_dir),args.limit)
    if args.result_file:
        write_json(Path(args.result_file), {'run_dir': str(directory) if directory else None})

if __name__=='__main__':
    if hasattr(sys.stdout,'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    main()
