import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Card from "../components/Card"

import "~style.css"

import {
  getIndexedBookmarksCount,
  getToken,
  semantic_search
} from "~utils/bookmark-util"

export default function BookmarkManagerPage() {
  const [bookmarks, setBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])
  const [semanticBookmarks, setSemanticBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])
  const [search, setSearch] = useState<string>("")

  const [isRegularSearching, setIsRegularSearching] = useState(false)
  const [isSemanticSearching, setIsSemanticSearching] = useState(false)
  const [regularSearchTime, setRegularSearchTime] = useState(0)
  const [semanticSearchTime, setSemanticSearchTime] = useState(0)
  const [error, setError] = useState<string>("")

  const [token, setToken] = useState<string | null>(null)
  const [indexedBookmarksCount, setIndexedBookmarksCount] = useState<number>(0)

  useEffect(() => {
    chrome.bookmarks.getRecent(10, (results) => {
      setBookmarks(results)
    })
    getToken().then((fetchedToken) => {
      setToken(fetchedToken)
      if (!fetchedToken) {
        setError("No token found. Please set your token in the Settings page.")
      }
    })
    getIndexedBookmarksCount().then((count) => {
      setIndexedBookmarksCount(count)
      if (count === 0) {
        setError("No indexed bookmarks found. Please build the index first.")
      }
    })
  }, [])

  const performSearch = useCallback(
    async (query: string) => {
      setIsRegularSearching(true)
      setIsSemanticSearching(true)
      setError("")

      // Regular search
      const regularStartTime = performance.now()
      const regularResults = await chrome.bookmarks.search(query)
      setRegularSearchTime(performance.now() - regularStartTime)
      setBookmarks(regularResults)
      setIsRegularSearching(false)

      // Semantic search
      if (token && indexedBookmarksCount > 0) {
        try {
          const semanticStartTime = performance.now()
          const semanticResults = await semantic_search(query, 10)
          setSemanticSearchTime(performance.now() - semanticStartTime)
          setSemanticBookmarks(semanticResults)
        } catch (err) {
          setError("Error performing semantic search. Please try again.")
        }
      } else if (!token) {
        setError("No token found. Please set your token in the Settings page.")
      } else {
        setError("No indexed bookmarks found. Please build the index first.")
      }

      setIsSemanticSearching(false)
    },
    [token, indexedBookmarksCount]
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch(search)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search bookmarks... (Press Enter to search)"
            value={search}
            onChange={handleSearch}
            onKeyPress={handleKeyPress}
            className="w-1/2 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-4">
          {/* Regular search results */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-4">Regular Search</h2>
            {isRegularSearching ? (
              <p className="text-gray-600">Searching...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {bookmarks.length} results
                  {regularSearchTime > 0 &&
                    ` (${regularSearchTime.toFixed(2)} ms)`}
                </p>
                <div className="space-y-4 overflow-hidden">
                  {bookmarks.map((bookmark) => (
                    <Card
                      key={bookmark.id}
                      bookmark={bookmark}
                      query={search}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Semantic search results */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Semantic Search</h2>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {(!token || indexedBookmarksCount === 0) && (
                <Link
                  to="/settings"
                  className="text-blue-500 hover:underline text-sm block mt-1">
                  Go to Settings
                </Link>
              )}
            </div>
            {isSemanticSearching ? (
              <p className="text-gray-600">Searching...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {semanticBookmarks.length} results
                  {semanticSearchTime > 0 &&
                    ` (${semanticSearchTime.toFixed(2)} ms)`}
                </p>
                <div className="space-y-4 overflow-hidden">
                  {semanticBookmarks.map((bookmark) => (
                    <Card
                      key={bookmark.id}
                      bookmark={bookmark}
                      query={search}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
