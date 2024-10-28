import debounce from "lodash/debounce"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Card from "../components/Card"

import "~style.css"

import { useGlobalState } from "~/tabs/content/GlobalStateContext"
import {
  getIndexedBookmarksCount,
  semantic_search
} from "~utils/BookmarkService"
import { getToken } from "~utils/StorageStore"

export default function BookmarkManagerPage() {
  const [search, setSearch] = useState<string>("")

  const [isRegularSearching, setIsRegularSearching] = useState(false)
  const [isSemanticSearching, setIsSemanticSearching] = useState(false)
  const [regularSearchTime, setRegularSearchTime] = useState(0)
  const [semanticSearchTime, setSemanticSearchTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [token, setToken] = useState<string | null>(null)
  const [indexedBookmarksCount, setIndexedBookmarksCount] = useState<number>(0)

  const { activeProvider, indexedProvider } = useGlobalState()

  const [combinedBookmarks, setCombinedBookmarks] = useState<
    chrome.bookmarks.BookmarkTreeNode[]
  >([])

  useEffect(() => {
    const loadSettings = async () => {
      const fetchedToken = await getToken(activeProvider.toLowerCase())
      setToken(fetchedToken)
      if (!fetchedToken && activeProvider.toLowerCase() !== "local") {
        setError(
          `No Api Key found. Please set your token in the Settings page.`
        )
      }
    }

    loadSettings()

    getIndexedBookmarksCount().then((count) => {
      setIndexedBookmarksCount(count)
      if (count === 0) {
        setError("No indexed bookmarks found. Please build the index first.")
      }
    })
  }, [activeProvider])

  useEffect(() => {
    if (activeProvider !== indexedProvider) {
      console.log(
        `activeProvider: ${activeProvider}, indexedProvider: ${indexedProvider}`
      )
      setError("Active provider and indexed provider do not match.")
    }
  }, [activeProvider, indexedProvider])

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCombinedBookmarks([])
        setRegularSearchTime(0)
        setSemanticSearchTime(0)
        return
      }

      setIsRegularSearching(true)
      setIsSemanticSearching(true)
      setError(null)

      try {
        const regularStartTime = performance.now()
        const regularResults = await chrome.bookmarks.search(query)
        setRegularSearchTime(performance.now() - regularStartTime)

        const semanticStartTime = performance.now()
        const semanticResults = await semantic_search(query, 100)
        setSemanticSearchTime(performance.now() - semanticStartTime)

        // Combine and deduplicate results
        const combinedResults = [...regularResults, ...semanticResults]
        const uniqueResults = Array.from(
          new Set(combinedResults.map((b) => b.id))
        ).map((id) => combinedResults.find((b) => b.id === id)!)

        setCombinedBookmarks(uniqueResults)
      } catch (err) {
        setError("An error occurred during search. Please try again.")
        console.error(err)
      } finally {
        setIsRegularSearching(false)
        setIsSemanticSearching(false)
      }
    },
    [semantic_search]
  )

  // Create a debounced version of performSearch
  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 300),
    [performSearch]
  )

  // Effect to trigger search when input changes
  useEffect(() => {
    debouncedSearch(search)
    // Cancel the debounce on useEffect cleanup
    return () => debouncedSearch.cancel()
  }, [search, debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search bookmarks..."
            className="w-1/2 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          {isRegularSearching || isSemanticSearching ? (
            <p className="text-gray-600">Searching...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                {combinedBookmarks.length} results
                {regularSearchTime > 0 &&
                  semanticSearchTime > 0 &&
                  ` (Regular: ${regularSearchTime.toFixed(2)} ms, Semantic: ${semanticSearchTime.toFixed(2)} ms)`}
              </p>
              <div className="space-y-4 overflow-hidden">
                {combinedBookmarks.map((bookmark) => (
                  <Card key={bookmark.id} bookmark={bookmark} query={search} />
                ))}
              </div>
            </>
          )}
          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        </div>
      </div>
    </div>
  )
}
