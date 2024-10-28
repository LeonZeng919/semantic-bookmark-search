import { Provider } from "~tabs/routes/Settings";
import { getActiveProvider, getBaseUrl, getToken } from "./StorageStore";
import { defaultBaseUrls } from "~tabs/components/TokenSettings";


// 定义一个接口来表示不同的嵌入方法
export interface EmbeddingMethod {
    getEmbedding(texts: string[]): Promise<number[][]>;
}

// 实现Jina嵌入方法
export class JinaEmbedding implements EmbeddingMethod {
    private static instance: JinaEmbedding;

    private constructor() { }

    public static getInstance(): JinaEmbedding {
        if (!JinaEmbedding.instance) {
            JinaEmbedding.instance = new JinaEmbedding();
        }
        return JinaEmbedding.instance;
    }

    async getEmbedding(texts: string[]): Promise<number[][]> {
        const provider = Provider.Jina
        const token = await getToken(provider);
        const baseUrl = await getBaseUrl(provider) || defaultBaseUrls[provider]
        if (!token) {
            throw new Error("Jina token not set");
        }
        try {
            const response = await fetch(`${baseUrl}/v1/embeddings`, {
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
                    "input": texts
                })
            })
            const data = await response.json()
            return data.data.map(item => item.embedding)
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }
}

export class OpenAIEmbedding implements EmbeddingMethod {
    private static instance: OpenAIEmbedding;

    private constructor() { }

    public static getInstance(): OpenAIEmbedding {
        if (!OpenAIEmbedding.instance) {
            OpenAIEmbedding.instance = new OpenAIEmbedding();
        }
        return OpenAIEmbedding.instance;
    }

    async getEmbedding(texts: string[]): Promise<number[][]> {
        const provider = Provider.OpenAI
        const token = await getToken(provider);
        const baseUrl = await getBaseUrl(provider) || defaultBaseUrls[provider]
        if (!token) {
            throw new Error("OpenAI token not set");
        }
        try {
            const response = await fetch(`${baseUrl}/v1/embeddings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    "model": "text-embedding-ada-002",
                    "input": texts
                })
            })
            const data = await response.json()
            return data.data.map(item => item.embedding)
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }
}

// 你可以添加其他嵌入方法的实现，例如：
export class LocalEmbedding implements EmbeddingMethod {
    private static instance: LocalEmbedding;

    private constructor() { }

    public static getInstance(): LocalEmbedding {
        if (!LocalEmbedding.instance) {
            LocalEmbedding.instance = new LocalEmbedding();
        }
        return LocalEmbedding.instance;
    }

    async getEmbedding(texts: string[]): Promise<number[][]> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: 'extract_features', sentences: texts },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }
}

// 工厂函数来获取嵌入方法实例
export async function getEmbeddingMethod(): Promise<EmbeddingMethod> {
    const method = await getActiveProvider();
    switch (method) {
        case Provider.OpenAI:
            return OpenAIEmbedding.getInstance();
        case Provider.Jina:
            return JinaEmbedding.getInstance();
        case Provider.Local:
            return LocalEmbedding.getInstance();
        default:
            return JinaEmbedding.getInstance();
    }
}
