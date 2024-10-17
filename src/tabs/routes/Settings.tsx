import { Eye, EyeOff, HelpCircle } from "lucide-react"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import {
  add_bookmark_to_index,
  getIndexedBookmarksCount,
  getToken,
  setToken,
  traverseBookmarks
} from "~utils/bookmark-util"

const storage = new Storage()

export default function Settings() {
  const [jinaToken, setJinaToken] = useState<string>("")
  const [indexingProgress, setIndexingProgress] = useState(0)
  const [totalBookmarks, setTotalBookmarks] = useState(0)
  const [isIndexing, setIsIndexing] = useState(false)
  const [error, setError] = useState<string>("")
  const [showToken, setShowToken] = useState(false)
  // Add new state for the explanation
  const [showExplanation, setShowExplanation] = useState(false)

  // Add a new state variable to track if all bookmarks are indexed
  const [allBookmarksIndexed, setAllBookmarksIndexed] = useState(false)

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        setJinaToken(token)
      } else {
        setError("No token found")
      }
    })
  }, [])

  useEffect(() => {
    if (!jinaToken) {
      setError("No token found")
    } else {
      setError("")
    }
  }, [jinaToken])

  useEffect(() => {
    // Check if indexing is in progress
    storage.get("isIndexing").then((indexing) => {
      setIsIndexing(Boolean(indexing))
    })

    // Check if all bookmarks are indexed
    Promise.all([getIndexedBookmarksCount(), chrome.bookmarks.getTree()]).then(
      ([indexedCount, bookmarkTreeNodes]) => {
        const allBookmarks = traverseBookmarks(bookmarkTreeNodes)
        setTotalBookmarks(allBookmarks.length)
        setIndexingProgress(indexedCount)
        setAllBookmarksIndexed(indexedCount === allBookmarks.length)
      }
    )
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isIndexing) {
      interval = setInterval(async () => {
        const count = await getIndexedBookmarksCount()
        setIndexingProgress(count)

        if (count === totalBookmarks) {
          setIsIndexing(false)
          setAllBookmarksIndexed(true)
          await storage.set("isIndexing", false)
          if (interval) clearInterval(interval)
        }
      }, 1000) // Poll every second
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isIndexing, totalBookmarks])

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJinaToken(e.target.value)
  }

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  const addBookmarksToIndex = async () => {
    await storage.set("isIndexing", true)
    setIsIndexing(true)

    chrome.bookmarks.getTree(async (results) => {
      const allBookmarks = traverseBookmarks(results)
      setTotalBookmarks(allBookmarks.length)

      for (const bookmark of allBookmarks) {
        if (bookmark.url) {
          await add_bookmark_to_index(bookmark)
        }
      }

      await storage.set("isIndexing", false)
    })
  }

  const saveToken = async () => {
    await setToken(jinaToken)
    alert("Token saved successfully!")
  }

  const toggleExplanation = () => {
    setShowExplanation(!showExplanation)
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>

      {/* Token Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Jina API Token</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span>Jina API key
            <button
              onClick={toggleExplanation}
              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none">
              <HelpCircle className="h-4 w-4 inline" />
            </button>
          </label>
          {showExplanation && (
            <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm">
              <p>Jina Token is used to authenticate with Jina AI services.</p>
              <p>You can use Jina AI services without creating an account.</p>
              <p>There's a free tier with 1 million tokens available.</p>
              <p>
                Visit{" "}
                <a
                  href="https://jina.ai/"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer">
                  https://jina.ai/
                </a>{" "}
                to get API key.
              </p>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={jinaToken}
              onChange={handleTokenChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={toggleTokenVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
              {showToken ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={saveToken}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Save Token
        </button>
      </div>

      {/* Indexing Section */}
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
            allBookmarksIndexed
              ? "bg-gray-400 text-gray-700 "
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}>
          {isIndexing
            ? "Indexing..."
            : allBookmarksIndexed
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
      </div>
    </div>
  )
}
