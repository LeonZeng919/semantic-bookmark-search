export default function Card({
  bookmark,
  query
}: {
  bookmark: chrome.bookmarks.BookmarkTreeNode
  query: string
}) {
  return (
    <div className="text-sm">
      <h2>
        <a
          href={bookmark.url}
          target="_blank"
          className="inline-block underline text-blue-500">
          <span
            dangerouslySetInnerHTML={{
              __html: bookmark.title?.replace(
                new RegExp(query, "gi"),
                `<span class="text-red-500">${query}</span>`
              )
            }}></span>
        </a>
      </h2>

      <span className="text-gray-500">
        {new Date(bookmark.dateAdded).toLocaleDateString()}
      </span>
      <span
        className="pl-2"
        dangerouslySetInnerHTML={{
          __html: bookmark.url?.replace(
            new RegExp(query, "gi"),
            `<span class="text-red-500">${query}</span>`
          )
        }}></span>
    </div>
  )
}
