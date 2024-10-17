import { openDB, type IDBPDatabase } from "idb"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

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
    const embedding = await getEmbedding(query);

    for (const item of data) {
        const similarity = cosineSimilarity(embedding, item.embedding);
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

// 新增：数据库连接管理器
class DBManager {
    private static instance: DBManager;
    private db: IDBPDatabase | null = null;

    private constructor() { }

    public static getInstance(): DBManager {
        if (!DBManager.instance) {
            DBManager.instance = new DBManager();
        }
        return DBManager.instance;
    }

    public async getDB(): Promise<IDBPDatabase> {
        if (!this.db) {
            this.db = await openDB("bookmark", 2, {
                upgrade: (db, oldVersion, newVersion) => {
                    if (oldVersion < 1) {
                        db.createObjectStore("bookmark", { keyPath: 'id' });
                    }
                    if (oldVersion < 2) {
                        db.createObjectStore("settings", { keyPath: 'key' });
                    }
                }
            });
        }
        return this.db;
    }

    public async closeDB(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

export async function add_bookmark_to_index(bookmark: chrome.bookmarks.BookmarkTreeNode) {
    const { title, url, dateAdded } = bookmark

    const db = await DBManager.getInstance().getDB()

    const bookmark_in_db = await db.get("bookmark", bookmark.id)
    if (bookmark_in_db) {
        console.log("bookmark already in db")
        return
    }

    const embedding = await getEmbedding(title)

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

async function getEmbedding(text: string): Promise<number[]> {
    const token = await getToken();
    if (!token) {
        throw new Error("Jina token not set");
    }
    const response = await fetch("https://api.jina.ai/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            "model": "jina-embeddings-v3",
            "task": "text-matching",
            "dimensions": 1024,
            "late_chunking": false,
            "embedding_type": "float",
            "input": [text]
        })
    })
    const data = await response.json()
    return data.data[0].embedding
}

// 新增：在应用退出时关闭数据库连接
export async function closeDatabase() {
    await DBManager.getInstance().closeDB();
}

function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error("Embeddings must have the same length");
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

export async function getToken(): Promise<string | null> {
    return await storage.get("jinaToken")
}

export async function setToken(token: string): Promise<void> {
    await storage.set("jinaToken", token)
}

export async function getIndexedBookmarksCount(): Promise<number> {
    const db = await DBManager.getInstance().getDB();
    return await db.count("bookmark");
}
