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
    const embeddings = await activeEmbeddingMethod.getEmbedding([query]);
    for (const item of data) {
        const similarity = multiEmbeddingsSimilarity(embeddings, item.embeddings, 'average'); // 或者使用 'max'
        result.push({
            ...item,
            similarity
        });
    }

    // 按相似度降序排序
    result.sort((a, b) => b.similarity - a.similarity);
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

    // Split the title using common website title separators, including underscore
    const titleParts = title.split(/\s*[|&\-–—_]\s*/).filter(part => part.trim() !== '')

    const db = await DBManager.getInstance().getDB()

    const bookmark_in_db = await db.get("bookmark", bookmark.id)
    if (bookmark_in_db) {
        console.log("bookmark already in db")
        return
    }

    const activeEmbeddingMethod = await getEmbeddingMethod()
    const embeddings = await activeEmbeddingMethod.getEmbedding(titleParts)
    await db.add("bookmark", {
        id: bookmark.id,
        title: title,
        url,
        dateAdded,
        embeddings, // 现在存储多个嵌入向量
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

// 新增：计算多个嵌入向量的相似度
function multiEmbeddingsSimilarity(embeddings1: number[][], embeddings2: number[][], method: 'average' | 'max' = 'max'): number {
    if (embeddings1.length === 0 || embeddings2.length === 0) {
        throw new Error("Empty embeddings array");
    }

    if (method === 'average') {
        // 计算平均嵌入向量
        const avgEmbedding1 = averageEmbeddings(embeddings1);
        const avgEmbedding2 = averageEmbeddings(embeddings2);
        return cosineSimilarity(avgEmbedding1, avgEmbedding2);
    } else if (method === 'max') {
        // 计算每对向量之间的相似度，取最大值
        let maxSimilarity = -1;
        for (const emb1 of embeddings1) {
            for (const emb2 of embeddings2) {
                const similarity = cosineSimilarity(emb1, emb2);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                }
            }
        }
        return maxSimilarity;
    } else {
        throw new Error("Invalid method. Use 'average' or 'max'");
    }
}

// 辅助函数：计算平均嵌入向量
function averageEmbeddings(embeddings: number[][]): number[] {
    const sum = embeddings.reduce((acc, curr) => {
        return acc.map((val, idx) => val + curr[idx]);
    }, new Array(embeddings[0].length).fill(0));
    return sum.map(val => val / embeddings.length);
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
