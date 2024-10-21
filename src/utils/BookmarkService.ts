import { DBManager } from "./DbStore"
import { getEmbeddingMethod, type EmbeddingMethod } from "./EmbeddingFactory"

export function traverseBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[], dir: string = null, callback: (result: string[]) => void = null) {
    const result = []
    for (const node of nodes) {
        if (node.children) {
            const newDir = dir ? `${dir}/${node.title}` : node.title
            result.push(...traverseBookmarks(node.children, newDir, callback))
        } else {
            result.push(node)
        }
    }
    return result
}

export async function semantic_search(query: string, top_k: number) {
    const result = [];
    const db = await DBManager.getInstance().getDB();
    const data = await db.getAll("bookmark");
    const activeEmbeddingMethod = await getEmbeddingMethod(); // 获取当前激活的嵌入方法
    const embedding = await activeEmbeddingMethod.getEmbedding(query);

    for (const item of data) {
        const similarity = cosineSimilarity(embedding, item.embedding);
        result.push({
            ...item,
            similarity
        });
    }

    // 按相似度降序排序
    result.sort((a, b) => b.similarity - a.similarity);
    console.log(result.map(item => ({ title: item.title, similarity: item.similarity })))
    // 只取前 top_k 个结果
    const topResults = result.slice(0, top_k);
    return topResults

}

export async function clearIndexDatabase() {
    const db = await DBManager.getInstance().getDB()
    await db.clear("bookmark")
}

export async function add_bookmark_to_index(bookmark: chrome.bookmarks.BookmarkTreeNode) {
    const { title, url, dateAdded } = bookmark

    const db = await DBManager.getInstance().getDB()

    const bookmark_in_db = await db.get("bookmark", bookmark.id)
    if (bookmark_in_db) {
        console.log("bookmark already in db")
        return
    }

    const activeEmbeddingMethod = await getEmbeddingMethod(); // 获取当前激活的嵌入方法
    const embedding = await activeEmbeddingMethod.getEmbedding(title)

    await db.add("bookmark", {
        id: bookmark.id,
        title,
        url,
        dateAdded,
        embedding,
    })
    console.log("add bookmark to idb")
}

// 新增：删除书签索引
export async function remove_bookmark_from_index(id: string) {
    const db = await DBManager.getInstance().getDB()
    await db.delete("bookmark", id)
    console.log("Removed bookmark from idb")
}

// 新增：在应用退出时关闭数据库连接
export async function closeDatabase() {
    await DBManager.getInstance().closeDB();
}

function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error("Embeddings length mismatch. Please go to Settings to rebuild the index.");
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        magnitude1 += embedding1[i] * embedding1[i];
        magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0; // 避免除以零
    }

    return dotProduct / (magnitude1 * magnitude2);
}



export async function getIndexedBookmarksCount(): Promise<number> {
    const db = await DBManager.getInstance().getDB();
    return await db.count("bookmark");
}

export async function getTotalBookmarks(): Promise<number> {
    return await chrome.bookmarks.getTree().then((results) => {
        return traverseBookmarks(results).length
    })
}

