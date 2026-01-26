import { GoogleGenerativeAI } from '@google/generative-ai'

export function createGeminiClient() {
    const apiKey = process.env.GOOGLE_AI_API_KEY

    if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY is not defined in environment variables')
    }

    return new GoogleGenerativeAI(apiKey)
}

// Helper to get Gemini model
export function getGeminiModel(modelName: string = 'gemini-pro') {
    const genAI = createGeminiClient()
    return genAI.getGenerativeModel({ model: modelName })
}
