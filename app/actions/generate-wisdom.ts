'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase-server'

interface Tip {
    title: string
    content: string
    category: 'saving' | 'emergency' | 'investment'
}

interface Verse {
    text: string
    reference: string
}

interface StructuredWisdom {
    verse: Verse
    tips: Tip[]
}

interface WisdomResult {
    success: boolean
    wisdom?: StructuredWisdom
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
        const income = transactions?.filter(t => t.type === 'income') || []

        const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        const totalInvestments = investments.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0)

        // Group expenses by category
        const categorySpending: Record<string, number> = {}
        expenses.forEach(t => {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount)
        })

        // Find top spending categories
        const topCategories = Object.entries(categorySpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        // Create structured wisdom prompt
        const prompt = `Você é José, um sábio conselheiro financeiro que usa princípios bíblicos.

Analise os dados financeiros e gere uma resposta ESTRITAMENTE em formato JSON sem markdown:

Dados Financeiros (este mês):
- Receitas: R$ ${totalIncome.toFixed(2)}
- Despesas: R$ ${totalExpenses.toFixed(2)}
- Investimentos: R$ ${totalInvestments.toFixed(2)}
- Transações: ${transactions?.length || 0}
${topCategories.length > 0 ? `- Maiores gastos: ${topCategories.map(c => `${c[0]} (R$ ${c[1].toFixed(2)})`).join(', ')}` : ''}

INSTRUÇÃO CRÍTICA: Retorne APENAS um JSON válido, SEM markdown, SEM \`\`\`json, SEM explicações.

Estrutura EXATA:
{
  "verse": {
    "text": "O versículo bíblico sobre prosperidade/prudência",
    "reference": "Livro Capítulo:Versículo"
  },
  "tips": [
    {
      "title": "Título da Dica 1",
      "content": "Conselho prático específico baseado nos dados (máximo 2 frases)",
      "category": "saving"
    },
    {
      "title": "Título da Dica 2",
      "content": "Conselho prático específico baseado nos dados (máximo 2 frases)",
      "category": "emergency"
    },
    {
      "title": "Título da Dica 3",
      "content": "Conselho prático específico baseado nos dados (máximo 2 frases)",
      "category": "investment"
    }
  ]
}

Regras:
1. Categories DEVEM ser exatamente: "saving", "emergency" ou "investment"
2. Conselhos PRÁTICOS baseados nos dados reais
3. Se gastou muito em lazer: conselho sobre redução
4. Se investe pouco: incentive reserva de emergência
5. Use números específicos quando possível (ex: "Corte 20% em lazer para poupar R$100/mês")
6. Versículos sugeridos: Provérbios 21:20, 6:6-8, 13:11, 21:5, Eclesiastes 11:2

RETORNE APENAS O JSON, NADA MAIS.`

        console.log('🤖 Calling Gemini for structured wisdom...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        let text = response.text().trim()

        // Remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        console.log('📝 Raw response:', text)

        // Parse JSON
        const wisdom: StructuredWisdom = JSON.parse(text)

        // Validate structure
        if (!wisdom.verse || !wisdom.verse.text || !wisdom.verse.reference) {
            throw new Error('Invalid verse structure')
        }
        if (!Array.isArray(wisdom.tips) || wisdom.tips.length !== 3) {
            throw new Error('Invalid tips structure')
        }

        console.log('✅ Structured wisdom generated successfully')

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
