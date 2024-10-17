import { useEffect } from "react"

function IndexPopup() {
  useEffect(() => {
    // 组件加载时立即打开新标签页
    chrome.tabs.create({
      url: "./tabs/app.html"
    })
    // 关闭当前弹出窗口
    window.close()
  }, [])

  // 返回 null，因为我们不需要渲染任何内容
  return null
}

export default IndexPopup
