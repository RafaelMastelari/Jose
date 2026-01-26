'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase-server'

interface WisdomResult {
    success: boolean
    wisdom?: string
    error?: string
}

export async function generateWisdom(): Promise<WisdomResult> {
    try {
        console.log('🙏 Generating biblical financial wisdom...')

        // Get Gemini API key
        const apiKey = process.env.GOOGLE_AI_API_KEY
        if (!apiKey) {
            return {
                success: false,
                error: 'Configuração de IA não encontrada.',
            }
        }

        // Get Supabase client and user
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Get current month transactions
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStartStr = monthStart.toISOString().split('T')[0]

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', monthStartStr)
            .order('date', { ascending: false })

        // Analyze spending patterns
        const expenses = transactions?.filter(t => t.type === 'expense') || []
        const investments = transactions?.filter(t => t.type === 'investment') || []
        const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        const totalInvestments = investments.reduce((sum, t) => sum + parseFloat(t.amount), 0)

        // Group expenses by category
        const categorySpending: Record<string, number> = {}
        expenses.forEach(t => {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount)
        })

        // Find top spending category
        const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0]

        // Build context for Gemini
        const context = {
            totalExpenses,
            totalInvestments,
            expenseCount: expenses.length,
            investmentCount: investments.length,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
            hasData: (transactions?.length || 0) > 0,
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        // Create biblical wisdom prompt
        const prompt = `Você é José, um sábio conselheiro financeiro que usa princípios bíblicos para orientar as pessoas.

Analise os dados financeiros do usuário e dê um conselho sábio, prático e breve:

Dados Financeiros (este mês):
- Total de Despesas: R$ ${totalExpenses.toFixed(2)}
- Total Investido (Vacas Gordas): R$ ${totalInvestments.toFixed(2)}
- Transações: ${expenses.length} despesas, ${investments.length} investimentos
${topCategory ? `- Maior gasto: ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)})` : ''}

Instruções:
1. Se gastou muito com supérfluos (lazer, restaurantes): conselho gentil sobre prudência usando Provérbios
2. Se investiu bem: parabenize usando a metáfora das "vacas gordas" (José do Egito)
3. Se tem poucos dados: incentive a começar guardando (formigas de Provérbios 6:6-8)
4. Tome solene mas prático, caloroso mas sábio
5. Máximo 3 frases curtas
6. Use emojis sutis (🌾, 💰, 📜)

CRÍTICO: Responda APENAS com o conselho, sem introduções, sem explicações extras, sem "José diz:".`

        console.log('🤖 Calling Gemini for wisdom...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const wisdom = response.text().trim()

        console.log('✅ Wisdom generated successfully')

        return {
            success: true,
            wisdom,
        }
    } catch (error: any) {
        console.error('❌ Error generating wisdom:', error)

        // Handle rate limit (429) error
        if (error.status === 429 || error.message?.includes('429')) {
            return {
                success: false,
                error: 'José está meditando. Tente novamente em alguns segundos.',
            }
        }

        return {
            success: false,
            error: `Erro: ${error.message}`,
        }
    }
}
