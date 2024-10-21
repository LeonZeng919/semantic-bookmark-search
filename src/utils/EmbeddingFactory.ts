import { ACTIVE_PROVIDER_KEY, Provider, providers } from "~tabs/routes/Settings";
import { getActiveProvider, getBaseUrl, getToken } from "./StorageStore";
import { defaultBaseUrls } from "~tabs/components/TokenSettings";


// 定义一个接口来表示不同的嵌入方法
export interface EmbeddingMethod {
    getEmbedding(text: string): Promise<number[]>;
}

// 实现Jina嵌入方法
export class JinaEmbedding implements EmbeddingMethod {
    async getEmbedding(text: string): Promise<number[]> {
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
                    "input": [text]
                })
            })
            const data = await response.json()
            return data.data[0].embedding
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }
}

export class OpenAIEmbedding implements EmbeddingMethod {
    async getEmbedding(text: string): Promise<number[]> {
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
                    "input": [text]
                })
            })
            const data = await response.json()
            return data.data[0].embedding
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }
}

// 你可以添加其他嵌入方法的实现，例如：
export class LocalEmbedding implements EmbeddingMethod {
    async getEmbedding(text: string): Promise<number[]> {
        // 实现本地嵌入逻辑
        return text.split('').map(char => char.charCodeAt(0));
    }
}

// 工厂函数来获取嵌入方法实例
export async function getEmbeddingMethod(): Promise<EmbeddingMethod> {
    const method = await getActiveProvider()
    switch (method) {
        case Provider.OpenAI:
            return new OpenAIEmbedding();
        case 'jina':
        default:
            return new JinaEmbedding();
    }
}

