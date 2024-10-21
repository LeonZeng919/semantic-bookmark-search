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
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexingProgress, setIndexingProgress] = useState(0)
  const [totalBookmarks, setTotalBookmarks] = useState(0)
  const [activeProvider, setActiveProvider] = useState<Provider | null>(
    Provider.Jina
  )
  const [indexedProvider, setIndexedProvider] = useState<Provider | null>(null)

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
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isIndexing) {
      interval = setInterval(async () => {
        const count = await getIndexedBookmarksCount()
        setIndexingProgress(count)

        if (count === totalBookmarks) {
          setIsIndexing(false)
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
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
        setIndexedProvider
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
