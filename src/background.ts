import { add_bookmark_to_index, remove_bookmark_from_index } from "~utils/BookmarkService"

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  console.log("Bookmark created:", bookmark)
  add_bookmark_to_index(bookmark)
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log("Bookmark removed:", id)
  remove_bookmark_from_index(id)
})