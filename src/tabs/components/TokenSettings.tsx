import { Eye, EyeOff, HelpCircle } from "lucide-react"
import { useEffect, useState } from "react"

import {
  getBaseUrl,
  getToken,
  saveBaseUrl,
  saveToken
} from "~utils/StorageStore"

export const defaultBaseUrls: Record<string, string> = {
  Jina: "https://api.jina.ai",
  OpenAI: "https://api.openai.com"
}

export default function TokenSettings({ provider }: { provider: string }) {
  const [token, setTokenState] = useState<string>("")
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [showToken, setShowToken] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const savedToken = await getToken(provider)
      const savedBaseUrl = await getBaseUrl(provider)
      setTokenState(savedToken || "")
      setBaseUrl(savedBaseUrl || "")
    }
    loadSettings()
  }, [provider])

  useEffect(() => {
    if (provider.toLowerCase() !== "local" && !token) {
      setError("No Api Key found")
    } else {
      setError("")
    }
  }, [token, provider])

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenState(e.target.value)
  }

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrl(e.target.value)
  }

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  const saveSettings = async () => {
    await saveToken(provider, token)
    const urlToSave = baseUrl || defaultBaseUrls[provider] || ""
    await saveBaseUrl(provider, urlToSave)
    alert(`${provider} settings saved successfully!`)
  }

  const toggleExplanation = () => {
    setShowExplanation(!showExplanation)
  }

  const getProviderInfo = () => {
    switch (provider) {
      case "Jina":
        return {
          url: "https://jina.ai/",
          description:
            "Jina Token is used to authenticate with Jina AI services. You can use Jina AI services without creating an account. There's a free tier with 1 million tokens available."
        }
      case "OpenAI":
        return {
          url: "https://platform.openai.com/",
          description:
            "OpenAI API key is required to use OpenAI's language models and other AI services."
        }
      case "Baidu":
        return {
          url: "https://ai.baidu.com/",
          description:
            "Baidu API key is needed to access Baidu's AI services, including the ERNIE-Bot model."
        }
      case "Anthropic":
        return {
          url: "https://www.anthropic.com/",
          description:
            "Anthropic API key is required to use Anthropic's AI models and services."
        }
      case "local":
        return {
          url: "",
          description: "No API key is required for local provider."
        }
      default:
        return {
          url: "",
          description: "API key is required to use this provider's AI services."
        }
    }
  }

  const providerInfo = getProviderInfo()

  if (provider.toLowerCase() === "local") {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">{provider} Settings</h3>
        <p>No additional settings required for local provider.</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">{provider} Settings</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-red-500">*</span>
          {provider} API key
          <button
            onClick={toggleExplanation}
            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none">
            <HelpCircle className="h-4 w-4 inline" />
          </button>
        </label>
        {showExplanation && (
          <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm">
            <p>{providerInfo.description}</p>
            {providerInfo.url && (
              <p>
                Visit{" "}
                <a
                  href={providerInfo.url}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer">
                  {providerInfo.url}
                </a>{" "}
                to get API key.
              </p>
            )}
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={handleTokenChange}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={toggleTokenVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
            {showToken ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base URL
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={handleBaseUrlChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={defaultBaseUrls[provider] || "Enter base URL (optional)"}
        />
      </div>
      <button
        onClick={saveSettings}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Save Settings
      </button>
    </div>
  )
}
