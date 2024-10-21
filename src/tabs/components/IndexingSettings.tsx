import React, { useEffect, useState } from "react"

import { useGlobalState } from "~/tabs/content/GlobalStateContext"
import { Provider } from "~tabs/routes/Settings"
import {
  add_bookmark_to_index,
  clearIndexDatabase,
  traverseBookmarks
} from "~utils/BookmarkService"
import {
  getActiveProvider,
  getIndexedProvider,
  saveIndexedProvider
} from "~utils/StorageStore"

export default function IndexingSettings() {
  const {
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
  } = useGlobalState()

  useEffect(() => {
    const loadData = async () => {
      // Get active provider
      const storedProvider = await getActiveProvider()
      setActiveProvider(storedProvider as Provider)

      // Get indexed provider
      const storedIndexedProvider = await getIndexedProvider()
      setIndexedProvider(storedIndexedProvider as Provider | null)
    }

    loadData()
  }, [])

  const addBookmarksToIndex = async () => {
    if (activeProvider !== indexedProvider) {
      await clearExistingIndex()
      await saveIndexedProvider(activeProvider)
      setIndexedProvider(activeProvider)
    }

    setIsIndexing(true)

    chrome.bookmarks.getTree(async (results) => {
      const allBookmarks = traverseBookmarks(results)
      setTotalBookmarks(allBookmarks.length)

      for (const bookmark of allBookmarks) {
        if (bookmark.url) {
          await add_bookmark_to_index(bookmark)
        }
      }
      setIsIndexing(false)
    })
  }

  const clearExistingIndex = async () => {
    console.log("Clearing existing index")
    await clearIndexDatabase()
    setIndexingProgress(0)
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Bookmark Indexing</h3>
      <div>
        <span>
          {indexingProgress || 0}/{totalBookmarks}
        </span>
      </div>
      <button
        onClick={addBookmarksToIndex}
        className={`px-4 py-2 rounded-md ${
          indexingProgress === totalBookmarks &&
          activeProvider === indexedProvider
            ? "bg-gray-400 text-gray-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}>
        {isIndexing
          ? "Indexing..."
          : indexingProgress === totalBookmarks &&
              activeProvider === indexedProvider
            ? "All Indexed"
            : "Add to index"}
      </button>
      {/* Progress bar for indexing */}
      {isIndexing && totalBookmarks > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${(indexingProgress / totalBookmarks) * 100}%`
              }}></div>
          </div>
          <p className="text-sm mt-2 text-gray-600">
            {indexingProgress}/{totalBookmarks} indexed
          </p>
        </div>
      )}
      {indexedProvider == null ? (
        <p className="text-sm mt-2 text-red-600">
          No indexed bookmarks found. Please build the index first.
        </p>
      ) : activeProvider !== indexedProvider ? (
        <p className="text-sm mt-2 text-yellow-600">
          Provider changed. Reindexing required. or switch to the provider{""}
          <span className="font-bold text-red-600">{indexedProvider}</span>
        </p>
      ) : null}
    </div>
  )
}
