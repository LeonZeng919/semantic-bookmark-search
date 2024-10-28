import React, { createContext, useContext, useEffect, useState } from "react"

import { Provider } from "~tabs/routes/Settings"
import {
  getIndexedBookmarksCount,
  getTotalBookmarks
} from "~utils/BookmarkService"
import { getActiveProvider, getIndexedProvider } from "~utils/StorageStore"

interface GlobalState {
  isIndexing: boolean
  setIsIndexing: (value: boolean) => void
  indexingProgress: number
  setIndexingProgress: (value: number) => void
  totalBookmarks: number
  setTotalBookmarks: (value: number) => void
  activeProvider: Provider | null
  setActiveProvider: (value: Provider | null) => void
  indexedProvider: Provider | null
  setIndexedProvider: (value: Provider | null) => void
  modelInitProgress: string
  setModelInitProgress: (value: string) => void
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexingProgress, setIndexingProgress] = useState(0)
  const [totalBookmarks, setTotalBookmarks] = useState(0)
  const [activeProvider, setActiveProvider] = useState<Provider | null>(
    Provider.Local
  )
  const [indexedProvider, setIndexedProvider] = useState<Provider | null>(
    Provider.Local
  )
  const [modelInitProgress, setModelInitProgress] = useState<string>("")

  useEffect(() => {
    const loadInitialData = async () => {
      const count = await getTotalBookmarks()
      setTotalBookmarks(count)

      const active = await getActiveProvider()
      setActiveProvider(active as Provider)

      const indexed = await getIndexedProvider()
      setIndexedProvider(indexed as Provider | null)
    }

    loadInitialData()

    // 添加消息监听器
    const messageListener = (message: any) => {
      if (message.action === "update_model_init_progress") {
        setModelInitProgress(message.progress)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const checkIndexingProgress = async () => {
      if (!isIndexing) return

      const count = await getIndexedBookmarksCount()
      setIndexingProgress(count)

      if (count === totalBookmarks) {
        setIsIndexing(false)
      } else {
        // 如果还没完成，1秒后再次检查
        timeoutId = setTimeout(checkIndexingProgress, 1000)
      }
    }

    // 立即执行一次检查
    checkIndexingProgress()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isIndexing, totalBookmarks])

  return (
    <GlobalStateContext.Provider
      value={{
        isIndexing,
        setIsIndexing,
        indexingProgress,
        setIndexingProgress,
        totalBookmarks,
        setTotalBookmarks,
        activeProvider,
        setActiveProvider,
        indexedProvider,
        setIndexedProvider,
        modelInitProgress,
        setModelInitProgress
      }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider")
  }
  return context
}
