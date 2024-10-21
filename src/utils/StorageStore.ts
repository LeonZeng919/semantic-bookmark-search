import { Storage } from "@plasmohq/storage"
import { Provider } from "~tabs/routes/Settings"
const storage = new Storage()

export const getToken = async (provider: string): Promise<string | null> => {
    return await storage.get(`${provider.toLowerCase()}_token`)
}

export const saveToken = async (provider: string, token: string): Promise<void> => {
    await storage.set(`${provider.toLowerCase()}_token`, token)
}

export const getBaseUrl = async (provider: string): Promise<string | null> => {
    return await storage.get(`${provider.toLowerCase()}_base_url`)
}

export const saveBaseUrl = async (provider: string, baseUrl: string): Promise<void> => {
    await storage.set(`${provider.toLowerCase()}_base_url`, baseUrl)
}

export const getActiveProvider = async (): Promise<string | null> => {
    return await storage.get("active_provider") || Provider.Jina
}

export const saveActiveProvider = async (provider: string): Promise<void> => {
    await storage.set("active_provider", provider)
}

export const getIndexedProvider = async (): Promise<string | null> => {
    return await storage.get("indexed_provider")
}

export const saveIndexedProvider = async (provider: string): Promise<void> => {
    await storage.set("indexed_provider", provider)
}

