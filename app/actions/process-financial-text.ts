'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase-server'

interface Transaction {
    date: string // YYYY-MM-DD
    description: string
    amount: number // Always positive
    type: 'income' | 'expense' | 'transfer' | 'investment'
    category: string
}

interface ProcessResult {
    success: boolean
    message?: string
    transactions?: Transaction[]
    duplicates?: Transaction[]
    error?: string
}

export async function processFinancialText(text: string): Promise<ProcessResult> {
    try {
        console.log('🔍 Processing financial text with José AI...')

        // Validate input
        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'Por favor, cole um extrato para analisar.',
            }
        }

        // Get Gemini API key
        const apiKey = process.env.GOOGLE_AI_API_KEY
        if (!apiKey) {
            return {
                success: false,
                error: 'Configuração de IA não encontrada. Entre em contato com o suporte.',
            }
        }

        // Initialize Gemini with Gemini 3 Flash model
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        // Create intelligent prompt for transaction categorization
        const prompt = `Você é o José, um assistente financeiro inteligente para usuários brasileiros.

TAREFA: Analise o extrato bancário abaixo e extraia TODAS as transações como um array JSON.

REGRAS DE NEGÓCIO:

1. TRANSFERÊNCIAS (type: 'transfer'):
   - "Transferência para mesma titularidade"
   - "Transferência entre contas"
   - "Resgate" (de investimentos para conta corrente)
   - "TED/PIX entre suas contas"
   
2. INVESTIMENTOS (type: 'investment', category: 'Investimento'):
   - "Aplicação", "CDB", "Tesouro Direto"
   - "Corretora", "Fundo de Investimento"
   - "LCI", "LCA"
   
3. RECEITAS (type: 'income'):
   - Salários → category: "Salário"
   - Pagamentos recebidos → category: "Freelance"
   - Reembolsos → category: "Reembolso"
   - Outros → category: "Outros"
   
4. DESPESAS (type: 'expense'):
   - Alimentação/Restaurantes → category: "Alimentação"
   - Uber/Gasolina/Transporte → category: "Transporte"
   - Cinema/Lazer → category: "Lazer"
   - Aluguel/Condomínio → category: "Moradia"
   - Farmácia/Médico → category: "Saúde"
   - Cursos/Livros → category: "Educação"
   - Outros → category: "Outros"

FORMATAÇÃO:

1. DATAS: Converta DD/MM/YYYY para YYYY-MM-DD
   Exemplo: "05/01/26" → "2026-01-05"

2. VALORES: SEMPRE positivos (absolutos)
   - Remova "R$", "-", "+", pontos de milhar
   - Use ponto decimal (.)
   - Exemplo: "R$ -250,00" → 250.00

CRÍTICO - FORMATO DE RESPOSTA:
Retorne APENAS o array JSON. NÃO adicione texto antes ou depois. NÃO use markdown. NÃO explique.

Formato:
[{"date":"2026-01-05","description":"Descrição","amount":100.00,"type":"income","category":"Salário"}]

EXTRATO:
${text}

Resposta:`

        console.log('🤖 Calling Gemini API for transaction extraction...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        let jsonText = response.text().trim()

        // Remove markdown code fences if present
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim()

        console.log('📄 Raw Gemini response:', jsonText.substring(0, 200) + '...')

        // Parse JSON
        let transactions: Transaction[]
        try {
            transactions = JSON.parse(jsonText)
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError)
            return {
                success: false,
                error: 'Não foi possível processar o extrato. Verifique o formato e tente novamente.',
            }
        }

        // Validate transactions
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return {
                success: false,
                error: 'Nenhuma transação encontrada no texto. Verifique o formato do extrato.',
            }
        }

        console.log(`✅ Extracted ${transactions.length} transactions`)

        // Get Supabase client and user
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado. Faça login novamente.',
            }
        }

        // Check for duplicates
        const { data: existingTransactions } = await supabase
            .from('transactions')
            .select('date, amount, description')
            .eq('user_id', user.id)

        const duplicates: Transaction[] = []
        const newTransactions: Transaction[] = []

        for (const transaction of transactions) {
            const isDuplicate = existingTransactions?.some(existing => {
                const sameDate = existing.date === transaction.date
                const sameAmount = Math.abs(parseFloat(existing.amount) - transaction.amount) < 0.01
                const similarDescription = existing.description.toLowerCase() === transaction.description.toLowerCase()
                return sameDate && sameAmount && similarDescription
            })

            if (isDuplicate) {
                duplicates.push(transaction)
            } else {
                newTransactions.push(transaction)
            }
        }

        if (newTransactions.length === 0) {
            return {
                success: false,
                error: 'Todas as transações já foram importadas anteriormente.',
                duplicates,
            }
        }

        // Insert new transactions
        const transactionsToInsert = newTransactions.map(t => ({
            user_id: user.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
        }))

        const { error: insertError } = await supabase
            .from('transactions')
            .insert(transactionsToInsert)

        if (insertError) {
            console.error('❌ Insert error:', insertError)
            return {
                success: false,
                error: 'Erro ao salvar transações. Tente novamente.',
            }
        }

        console.log(`✅ Successfully inserted ${newTransactions.length} transactions`)

        return {
            success: true,
            message: `${newTransactions.length} transações importadas com sucesso!`,
            transactions: newTransactions,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
        }
    } catch (error: any) {
        console.error('❌ Error processing financial text:', error)

        // Handle rate limit (429) error
        if (error.status === 429 || error.message?.includes('429')) {
            return {
                success: false,
                error: 'O José está sobrecarregado. Tente novamente em alguns segundos.',
            }
        }

        return {
            success: false,
            error: `Erro: ${error.message}`,
        }
    }
}
