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
    stats?: {
        localParsed: number
        aiParsed: number
        total: number
    }
}

// Local keyword-based categorization
function categorizeByKeyword(description: string): { type: 'income' | 'expense' | 'transfer' | 'investment', category: string } {
    const desc = description.toLowerCase()

    // Alimentação
    if (desc.includes('pizza') || desc.includes('ifood') || desc.includes('restaurante') ||
        desc.includes('mercado') || desc.includes('padaria') || desc.includes('lanche') ||
        desc.includes('delivery') || desc.includes('food') || desc.includes('mc') ||
        desc.includes('burger') || desc.includes('sushi')) {
        return { type: 'expense', category: 'Alimentação' }
    }

    // Transporte
    if (desc.includes('uber') || desc.includes('99') || desc.includes('posto') ||
        desc.includes('gasolina') || desc.includes('combustivel') || desc.includes('alcool') ||
        desc.includes('taxi') || desc.includes('onibus') || desc.includes('metro')) {
        return { type: 'expense', category: 'Transporte' }
    }

    // Lazer
    if (desc.includes('cinema') || desc.includes('show') || desc.includes('netflix') ||
        desc.includes('spotify') || desc.includes('amazon') || desc.includes('disney')) {
        return { type: 'expense', category: 'Lazer' }
    }

    // Saúde
    if (desc.includes('farmacia') || desc.includes('drogaria') || desc.includes('medico') ||
        desc.includes('hospital') || desc.includes('consulta')) {
        return { type: 'expense', category: 'Saúde' }
    }

    // Moradia
    if (desc.includes('aluguel') || desc.includes('condominio') || desc.includes('agua') ||
        desc.includes('luz') || desc.includes('energia') || desc.includes('internet')) {
        return { type: 'expense', category: 'Moradia' }
    }

    // Investimento
    if (desc.includes('aplicacao') || desc.includes('investimento') || desc.includes('cdb') ||
        desc.includes('tesouro') || desc.includes('fundo')) {
        return { type: 'investment', category: 'Investimento' }
    }

    // Compra no débito/crédito (bancos)
    if (desc.includes('compra no debito') || desc.includes('compra no credito') ||
        desc.includes('pagamento cartao') || desc.includes('fatura')) {
        return { type: 'expense', category: 'Outros' }
    }

    // Transferência
    if (desc.includes('transferencia') || desc.includes('pix') || desc.includes('ted')) {
        return { type: 'transfer', category: 'Transferência' }
    }

    // Salário/Renda
    if (desc.includes('salario') || desc.includes('pagamento') || desc.includes('deposito')) {
        return { type: 'income', category: 'Salário' }
    }

    // Default
    return { type: 'expense', category: 'Outros' }
}

// Parse date helpers
function parseDate(dateStr: string, yearHint?: number): string | null {
    const year = yearHint || new Date().getFullYear()

    // Try DD/MM/YY or DD/MM/YYYY
    const match1 = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
    if (match1) {
        const day = match1[1].padStart(2, '0')
        const month = match1[2].padStart(2, '0')
        let yearPart = match1[3]

        // Convert YY to YYYY
        if (yearPart.length === 2) {
            yearPart = `20${yearPart}`
        }

        return `${yearPart}-${month}-${day}`
    }

    // Try DD.MM (current year)
    const match2 = dateStr.match(/(\d{1,2})\.(\d{1,2})/)
    if (match2) {
        const day = match2[1].padStart(2, '0')
        const month = match2[2].padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Today/Ontem
    if (dateStr.toLowerCase().includes('hoje')) {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    if (dateStr.toLowerCase().includes('ontem')) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().split('T')[0]
    }

    return null
}

// Parse amount helper
function parseAmount(amountStr: string): number | null {
    try {
        // Remove R$, espaços, sinais
        let cleaned = amountStr
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\+/g, '')
            .replace(/-/g, '')
            .trim()

        // Replace comma with dot
        cleaned = cleaned.replace(',', '.')

        // Remove thousand separators (dots before last dot)
        const parts = cleaned.split('.')
        if (parts.length > 2) {
            // Multiple dots, combine all but last
            cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
        }

        const amount = parseFloat(cleaned)
        return isNaN(amount) ? null : Math.abs(amount)
    } catch {
        return null
    }
}

// Local regex parsing function
function parseLineLocally(line: string): Transaction | null {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Pattern 1: DD/MM/YY - Description - Amount
    // Example: "26/01/26 - pizza - 49" or "26.01.26 - pizza - R$ 49,00"
    const pattern1 = /^([\d\/\.\-]+)\s*[\-\|]\s*(.+?)\s*[\-\|]\s*([\d\.,R\$\s\+\-]+)$/
    const match1 = trimmed.match(pattern1)
    if (match1) {
        const date = parseDate(match1[1])
        const description = match1[2].trim()
        const amount = parseAmount(match1[3])

        if (date && amount !== null && description) {
            const { type, category } = categorizeByKeyword(description)
            return { date, description, amount, type, category }
        }
    }

    // Pattern 2: DD.MM - Amount - Description
    // Example: "26.01 - 49,00 - pizzaria"
    const pattern2 = /^([\d\.]+)\s*[\-\|]\s*([\d\.,R\$\s\+\-]+)\s*[\-\|]\s*(.+)$/
    const match2 = trimmed.match(pattern2)
    if (match2) {
        const date = parseDate(match2[1])
        const amount = parseAmount(match2[2])
        const description = match2[3].trim()

        if (date && amount !== null && description) {
            const { type, category } = categorizeByKeyword(description)
            return { date, description, amount, type, category }
        }
    }

    // Pattern 3: Today/Yesterday - Description - Amount
    // Example: "Hoje - pizza - R$ 49"
    const pattern3 = /^(hoje|ontem)\s*[\-\|]\s*(.+?)\s*[\-\|]\s*([\d\.,R\$\s\+\-]+)$/i
    const match3 = trimmed.match(pattern3)
    if (match3) {
        const date = parseDate(match3[1])
        const description = match3[2].trim()
        const amount = parseAmount(match3[3])

        if (date && amount !== null && description) {
            const { type, category } = categorizeByKeyword(description)
            return { date, description, amount, type, category }
        }
    }

    // Pattern 4: Bank format with UUID and transaction type
    // Example: "01/12/2025 - -9.5 - 692d6974-6e3f-4fd0-a75a-c9a7234cb3e5 - Compra no débito"
    const pattern4 = /^([\d\/\-\.]+)\s*[\-\|]\s*([\d\.,\+\-]+)\s*[\-\|]\s*[a-f0-9\-]{30,}\s*[\-\|]\s*(.+)$/i
    const match4 = trimmed.match(pattern4)
    if (match4) {
        const date = parseDate(match4[1])
        const amount = parseAmount(match4[2])
        const description = match4[3].trim()

        if (date && amount !== null && description) {
            const { type, category } = categorizeByKeyword(description)
            return { date, description, amount, type, category }
        }
    }

    return null
}

export async function processFinancialText(text: string): Promise<ProcessResult> {
    try {
        console.log('🔍 Processing financial text with hybrid parser...')

        // Validate input
        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'Por favor, cole um extrato para analisar.',
            }
        }

        // Split text into lines
        const lines = text.split('\n').filter(l => l.trim())

        // LOCAL PARSING FIRST
        const localTransactions: Transaction[] = []
        const unparsedLines: string[] = []

        for (const line of lines) {
            const parsed = parseLineLocally(line)
            if (parsed) {
                localTransactions.push(parsed)
                console.log('✅ Local parse:', line.substring(0, 50))
            } else {
                unparsedLines.push(line)
            }
        }

        console.log(`📊 Local parsing: ${localTransactions.length}/${lines.length} lines parsed`)

        // AI FALLBACK for unparsed lines
        let aiTransactions: Transaction[] = []

        if (unparsedLines.length > 0) {
            console.log(`🤖 Sending ${unparsedLines.length} lines to AI...`)

            const apiKey = process.env.GOOGLE_AI_API_KEY
            if (!apiKey) {
                // If no API key but we have local results, continue
                if (localTransactions.length === 0) {
                    return {
                        success: false,
                        error: 'Configuração de IA não encontrada.',
                    }
                }
            } else {
                try {
                    const genAI = new GoogleGenerativeAI(apiKey)
                    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

                    const prompt = `Você é o José, um assistente financeiro inteligente para usuários brasileiros.

TAREFA: Analise o extrato bancário abaixo e extraia TODAS as transações como um array JSON.

REGRAS DE CATEGORIZAÇÃO:
1. TRANSFERÊNCIAS (type: 'transfer'): Transferência entre contas, TED, PIX
2. INVESTIMENTOS (type: 'investment'): Aplicação, CDB, Tesouro, Corretora
3. RECEITAS (type: 'income'): Salários, Freelance, Reembolsos
4. DESPESAS (type: 'expense'): Alimentação, Transporte, Lazer, Moradia, Saúde, Educação, Outros

FORMATAÇÃO:
- DATAS: Converta para YYYY-MM-DD (exemplo: "05/01/26" → "2026-01-05")
- VALORES: SEMPRE positivos (remova R$, -, +)
- Use ponto decimal (.)

CRÍTICO: Retorne APENAS o array JSON. NÃO adicione texto, markdown ou explicações.

Formato: [{"date":"2026-01-05","description":"Descrição","amount":100.00,"type":"expense","category":"Alimentação"}]

EXTRATO:
${unparsedLines.join('\n')}

Resposta:`

                    const result = await model.generateContent(prompt)
                    const response = await result.response
                    let jsonText = response.text().trim()

                    jsonText = jsonText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim()

                    aiTransactions = JSON.parse(jsonText)
                    console.log(`✅ AI parsed: ${aiTransactions.length} transactions`)
                } catch (aiError: any) {
                    console.error('⚠️ AI parsing failed, continuing with local results only:', aiError.message)
                    // Continue with local results only
                }
            }
        }

        // COMBINE RESULTS
        const allTransactions = [...localTransactions, ...aiTransactions]

        if (allTransactions.length === 0) {
            return {
                success: false,
                error: 'Nenhuma transação encontrada. Verifique o formato do extrato, exemplo, 05/01/26 | 100.00 | Descrição | Tipo | Categoria',
            }
        }

        console.log(`✅ Total extracted: ${allTransactions.length} transactions`)

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

        for (const transaction of allTransactions) {
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
            stats: {
                localParsed: localTransactions.length,
                aiParsed: aiTransactions.length,
                total: allTransactions.length,
            }
        }
    } catch (error: any) {
        console.error('❌ Error processing financial text:', error)

        // Handle rate limit (429) or 503 error
        if (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503')) {
            return {
                success: false,
                error: 'O José está sobrecarregado. Mas você pode usar o formato simples: "DD/MM/YY - descrição - valor"',
            }
        }

        return {
            success: false,
            error: `Erro: ${error.message}`,
        }
    }
}
