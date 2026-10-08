"""Validate a completed human review before enabling normal local inference."""
import argparse
import csv
from common import digest, fingerprint, latest_run, read_json, write_json

def approve(directory):
    record=read_json(directory/'run.json')
    if not (record['mode']=='train' and record['status']=='completed'):
        raise ValueError('Chỉ nghiệm thu lượt train đầy đủ hoàn tất.')
    if not (record['fingerprint']==fingerprint()):
        raise ValueError('Dữ liệu/cấu hình không khớp lượt chạy.')
    answers=read_json(directory/'evaluation/answers.json')
    if not (len(answers)==52):
        raise ValueError('Điều kiện kiểm tra dữ liệu/model không đạt.')
    expected={(a['id'],v) for a in answers for v in ['base','base_with_context','adapter_with_context']}
    scores={}; seen=set(); severe=False
    with (directory/'evaluation/review.csv').open(encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            key=(row['id'],row['variant'])
            if not (key in expected and key not in seen):
                raise ValueError('ID hoặc variant trùng/sai.')
            seen.add(key)
            fields=['knowledge_correct','a1_a2_fit','vietnamese_explanation','preserves_intent','lesson_grounded','severe_error']
            if not (all(row[field] in {'0','1'} for field in fields)):
                raise ValueError('Điền 0 hoặc 1 cho mọi tiêu chí của tất cả 156 câu trả lời.')
            scores.setdefault(row['variant'],[]).append([int(row[field]) for field in fields])
    if not (seen==expected):
        raise ValueError('Thiếu hàng chấm.')
    tuned=scores['adapter_with_context']; base=scores['base_with_context']
    if not (sum(x[0] for x in tuned)/52>=0.9):
        raise ValueError('Độ đúng dưới 90%.')
    if not (not any(x[-1] for x in tuned)):
        raise ValueError('Có lỗi nghiêm trọng.')
    if not (sum(sum(x[:5]) for x in tuned)>sum(sum(x[:5]) for x in base)):
        raise ValueError('Chưa tốt hơn model gốc có ngữ cảnh.')
    review={'status':'approved','fingerprint':fingerprint(),'review_sha256':digest(directory/'evaluation/review.csv'),'answers_sha256':digest(directory/'evaluation/answers.json'),'adapter_sha256':digest(directory/'adapter/adapter_model.safetensors'),'knowledge_accuracy':sum(x[0] for x in tuned)/52}
    write_json(directory/'approval.json',review)
    print('Đã ghi nhận nghiệm thu theo bảng chấm của người rà soát.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--run-dir'); args=parser.parse_args()
    approve(latest_run(args.run_dir,full_only=True))
