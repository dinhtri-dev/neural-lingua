"""Developer GPU check: full accumulation/evaluation profile and actual resume.

Only two optimizer steps; never a substitute for full training or human review.
"""
import gc
import math
import torch
from common import config, validate_data, write_json
from pipeline import preflight, load_base, encoded_data, trainer_for, new_run, update_run

def main():
    from transformers import set_seed
    directory=new_run('profile-check')
    dtype=preflight(); set_seed(config()['seed'])
    for steps in [1,2]:
        model,tokenizer=load_base(dtype)
        data=encoded_data(validate_data(),tokenizer)
        trainer=trainer_for(model,tokenizer,data,directory,smoke=False)
        trainer.args.max_steps=steps
        trainer.args.eval_strategy='steps'; trainer.args.eval_steps=1
        trainer.args.save_strategy='steps'; trainer.args.save_steps=1
        trainer.args.logging_steps=1
        checkpoint=str(directory/'checkpoints/checkpoint-1') if steps==2 else None
        result=trainer.train(resume_from_checkpoint=checkpoint)
        assert math.isfinite(result.training_loss) and trainer.state.global_step==steps
        assert any('eval_loss' in x for x in trainer.state.log_history)
        trainer.model.save_pretrained(directory/'adapter',safe_serialization=True)
        tokenizer.save_pretrained(directory/'adapter')
        write_json(directory/f'profile-{steps}.json',{'loss':result.training_loss,'global_step':trainer.state.global_step,'resumed':steps==2,'validation_ran':True,'best_checkpoint':trainer.state.best_model_checkpoint,'gradient_accumulation_steps':trainer.args.gradient_accumulation_steps})
        del trainer,model,data;gc.collect();torch.cuda.empty_cache()
    update_run(directory,status='completed',note='QA only: one optimizer step then resume to two; not a full training run.')
    print('Profile train và tiếp tục checkpoint đã qua:',directory)

if __name__=='__main__': main()
