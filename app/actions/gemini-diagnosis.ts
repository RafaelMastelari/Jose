'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function getFinancialDiagnosis() {
    try {
        // Debug: Log environment variable
        console.log('🔍 Checking API Key...')
        console.log('GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY)
        console.log('GOOGLE_AI_API_KEY length:', process.env.GOOGLE_AI_API_KEY?.length || 0)

        const apiKey = process.env.GOOGLE_AI_API_KEY

        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY não está definida no .env.local')
        }

        // Initialize Gemini client with Gemini 3 Flash model
        // Latest model ideal for financial analysis
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        // Mock financial data for demonstration
        const financialData = {
            saldo: 5420,
            gastos_mes: 3250,
            receitas_mes: 5000,
            categorias: {
                alimentacao: 1200,
                transporte: 450,
                lazer: 600,
                moradia: 1000,
            },
        }

        const prompt = `
Como José, um consultor financeiro pessoal, analise os seguintes dados financeiros e forneça insights práticos:

Dados Financeiros:
- Saldo atual: R$ ${financialData.saldo}
- Gastos do mês: R$ ${financialData.gastos_mes}
- Receitas do mês: R$ ${financialData.receitas_mes}
- Categorias de gastos:
  * Alimentação: R$ ${financialData.categorias.alimentacao}
  * Transporte: R$ ${financialData.categorias.transporte}
  * Lazer: R$ ${financialData.categorias.lazer}
  * Moradia: R$ ${financialData.categorias.moradia}

Forneça uma análise em português brasileiro que inclua:
1. Resumo da situação financeira atual
2. Pontos positivos identificados
3. Áreas que precisam de atenção
4. 3 recomendações práticas e específicas
5. Previsão de economia potencial

Seja amigável, direto e motivador. Use emojis quando apropriado.
    `.trim()

        console.log('🤖 Calling Gemini 3 Flash Preview API...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log('✅ Gemini response received successfully')
        return { success: true, analysis: text }
    } catch (error: any) {
        console.error('❌ Error generating diagnosis:', error)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)

        // Handle rate limit (429) error
        if (error.status === 429 || error.message?.includes('429')) {
            return {
                success: false,
                error: 'O José está sobrecarregado. Tente novamente em alguns segundos.',
            }
        }

        return {
            success: false,
            error: `Erro ao gerar diagnóstico: ${error.message}. Verifique o console do servidor para mais detalhes.`,
        }
    }
}
