import React, { useEffect, useState } from "react"

import { useGlobalState } from "~tabs/content/GlobalStateContext"
import { getActiveProvider, saveActiveProvider } from "~utils/StorageStore"

import IndexingSettings from "../components/IndexingSettings"
import TokenSettings from "../components/TokenSettings"

// 定义 Provider 枚举

export enum Provider {
  Local = "Local",
  Jina = "Jina",
  OpenAI = "OpenAI"
}

export const providers = Object.values(Provider)

export default function Settings() {
  const { activeProvider, setActiveProvider } = useGlobalState()
  useEffect(() => {
    // 组件挂载时从storage读取activeProvider
    const loadActiveProvider = async () => {
      const storedProvider = await getActiveProvider()
      setActiveProvider((storedProvider as Provider) || Provider.Local)
    }
    loadActiveProvider()
  }, [])

  const handleProviderChange = async (provider: Provider) => {
    setActiveProvider(provider)
    // 将新的activeProvider保存到storage
    await saveActiveProvider(provider)
  }

  if (activeProvider === null) {
    return <div>Loading...</div> // 或者其他加载指示器
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Select AI Provider</h2>
        <div className="flex border-b">
          {providers.map((provider) => (
            <button
              key={provider}
              className={`py-2 px-4 ${
                activeProvider === provider
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => handleProviderChange(provider)}>
              {provider}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <TokenSettings provider={activeProvider} />
        </div>
      </div>

      <IndexingSettings />
    </div>
  )
}
