// Dedicated CPU worker: recordings never leave this worker/browser.
import {pipeline, env} from '../voice-assets/vendor/transformers.min.js';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('../voice-assets/models/', import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = new URL('../voice-assets/vendor/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let recognizer = null, busy = false;
const languages = new Set(['auto', 'vi', 'en', 'fr', 'es', 'ja', 'ko', 'zh']);

self.addEventListener('message', async ({data}) => {
  if (!data || !Number.isSafeInteger(data.id) || busy) return;
  const {id, type} = data;
  if (!['prepare', 'transcribe'].includes(type)) return;
  busy = true;
  try {
    if (!recognizer) {
      recognizer = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        device: 'wasm', dtype: 'q8',
        progress_callback: progress => {
          if (progress.status === 'progress' && Number.isFinite(progress.progress)) {
            self.postMessage({id, type: 'progress', percent: Math.round(progress.progress)});
          }
        },
      });
    }
    if (type === 'prepare') {
      self.postMessage({id, type: 'ready'});
    } else {
      const {audio, language} = data;
      if (!(audio instanceof Float32Array) || audio.length < 1600 || audio.length > 480000 || !languages.has(language)) throw new Error('Invalid audio');
      let energy = 0;
      for (const sample of audio) {if (!Number.isFinite(sample)) throw new Error('Invalid audio'); energy += sample * sample;}
      if (Math.sqrt(energy / audio.length) < 0.003) {
        self.postMessage({id, type: 'empty'});
      } else {
        const options = {task: 'transcribe', max_new_tokens: 128};
        if (language !== 'auto') options.language = language;
        const result = await recognizer(audio, options);
        const text = typeof result.text === 'string' ? result.text.trim().slice(0, 5000) : '';
        self.postMessage({id, type: text ? 'result' : 'empty', text});
      }
    }
  } catch {
    // Do not expose audio, model internals or full exception messages.
    self.postMessage({id, type: 'error', phase: type});
  } finally {
    busy = false;
  }
});
