import { add_bookmark_to_index, remove_bookmark_from_index } from "~utils/BookmarkService"
import { pipeline, env } from '@xenova/transformers';
// 禁用本地模型检查
env.allowLocalModels = false;

// 由于 onnxruntime-web 的 bug，我们暂时禁用多线程
env.backends.onnx.wasm.numThreads = 1;

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback: (data) => {
          const progressPercentage = data.status === 'progress' ? Math.round(data.progress) : '';
          const progressMessage = `${data.status}${progressPercentage ? ': ' + progressPercentage + '%' : ''}`;

          // 发送进度消息到UI
          chrome.runtime.sendMessage({
            action: 'update_model_init_progress',
            progress: progressMessage
          });
        }
      });
    }
    return this.instance;
  }
}

async function extractFeatures(sentences) {
  let extractor = await PipelineSingleton.getInstance();
  const output = await extractor(sentences, { pooling: 'mean', normalize: true });
  return output;
}

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  console.log("Bookmark created:", bookmark)
  add_bookmark_to_index(bookmark)
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log("Bookmark removed:", id)
  remove_bookmark_from_index(id)
})



// 可以添加消息监听器来处理来自 UI 的请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extract_features') {
    (async function () {
      const output = await extractFeatures(message.sentences);
      const embeddings = output.tolist()
      sendResponse(embeddings);
    })();
    return true; // 表示我们将异步发送响应
  }
});
