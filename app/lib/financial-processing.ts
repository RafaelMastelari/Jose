
import { GoogleGenerativeAI } from '@google/generative-ai'
import { SupabaseClient } from '@supabase/supabase-js'

export interface Transaction {
    date: string // YYYY-MM-DD
    description: string
    amount: number // Can be negative now!
    type: 'income' | 'expense' | 'transfer' | 'investment'
    category: string
    subcategory?: string | null
}

export interface ProcessResult {
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

// Slugify helper for category learning
function slugify(text: string): string {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '') // Remove non-alphanumeric
        .trim()
}

// Investment categorization: Distinguish applications from redemptions
function categorizeInvestment(description: string, amount: number): { type: 'investment', category: string } | null {
    const lowerDesc = description.toLowerCase()

    // Redemption keywords (positive amounts - money coming back)
    const redemptionKeywords = ['resgate', 'resg', 'rendimento', 'resgate cdb', 'resgate rdb', 'dividendo']
    const isRedemption = redemptionKeywords.some(kw => lowerDesc.includes(kw))

    // Application keywords (negative amounts - money being invested)
    const applicationKeywords = ['aplicação', 'aplicacao', 'apl', 'cdb', 'rdb', 'lci', 'lca', 'poupança', 'poupanca', 'tesouro', 'fundo']
    const isApplication = applicationKeywords.some(kw => lowerDesc.includes(kw))

    // Redemption: positive amount + redemption keywords
    if (isRedemption && amount > 0) {
        return { type: 'investment', category: 'investimento' }
    }

    // Application: negative amount + application keywords
    if (isApplication && amount < 0) {
        return { type: 'investment', category: 'investimento' }
    }

    return null // Not an investment
}

// Smart categorization with memory consultation
async function smartCategorize(description: string, userId: string, supabase: SupabaseClient): Promise<{ type: 'income' | 'expense' | 'transfer' | 'investment', category: string, subcategory?: string | null } | null> {
    const slug = slugify(description)

    // LEVEL 1: Personal History - Check user's own transactions
    const { data: personalHistory } = await supabase
        .from('transactions')
        .select('category, subcategory, type')
        .eq('user_id', userId)
        .ilike('description', `%${description}%`)
        .limit(1)
        .single()

    if (personalHistory) {
        console.log('✅ Category from personal history:', personalHistory)
        return {
            type: personalHistory.type,
            category: personalHistory.category,
            subcategory: personalHistory.subcategory
        }
    }

    // LEVEL 2: Global Hints - Check crowd intelligence
    const { data: globalHints } = await supabase
        .from('global_category_hints')
        .select('category, subcategory')
        .eq('description_slug', slug)
        .order('votes', { ascending: false })
        .limit(1)
        .single()

    if (globalHints) {
        console.log('✅ Category from global hints:', globalHints)
        // Global hints only have category, use keyword matching for type
        const keywordResult = categorizeByKeyword(description)
        return {
            type: keywordResult.type,
            category: globalHints.category,
            subcategory: globalHints.subcategory
        }
    }

    // No memory found, return null to fall back to keyword matching
    return null
}

// Month name to number mapping (PT-BR)
const monthMap: Record<string, number> = {
    'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
}

// Local keyword-based categorization (enhanced for Nubank)
function categorizeByKeyword(description: string): { type: 'income' | 'expense' | 'transfer' | 'investment', category: string } {
    const desc = description.toLowerCase()

    // Transferência Nubank - Will be typed by amount later
    if (desc.includes('pix') || desc.includes('transferencia') || desc.includes('ted') ||
        desc.includes('transferência')) {
        return { type: 'expense', category: 'Transferência' }
    }

    // Investimento Nubank
    if (desc.includes('rdb') || desc.includes('resgate') || desc.includes('aplicacao') ||
        desc.includes('aplicação') || desc.includes('investimento') || desc.includes('cdb') ||
        desc.includes('tesouro') || desc.includes('fundo')) {
        return { type: 'investment', category: 'Investimento' }
    }

    // Alimentação
    if (desc.includes('pizza') || desc.includes('ifood') || desc.includes('restaurante') ||
        desc.includes('mercado') || desc.includes('padaria') || desc.includes('lanche') ||
        desc.includes('delivery') || desc.includes('food') || desc.includes('mc') ||
        desc.includes('burger') || desc.includes('sushi') || desc.includes('sonda') ||
        desc.includes('supermercado') || desc.includes('cafe') || desc.includes('cafeteria') ||
        desc.includes('starbucks') || desc.includes('subway')) {
        return { type: 'expense', category: 'Alimentação' }
    }

    // Transporte
    if (desc.includes('uber') || desc.includes('99') || desc.includes('posto') ||
        desc.includes('gasolina') || desc.includes('combustivel') || desc.includes('alcool') ||
        desc.includes('taxi') || desc.includes('onibus') || desc.includes('metro') ||
        desc.includes('estacionamento') || desc.includes('combustível')) {
        return { type: 'expense', category: 'Transporte' }
    }

    // Lazer
    if (desc.includes('cinema') || desc.includes('show') || desc.includes('netflix') ||
        desc.includes('spotify') || desc.includes('amazon') || desc.includes('disney') ||
        desc.includes('prime')) {
        return { type: 'expense', category: 'Lazer' }
    }

    // Saúde
    if (desc.includes('farmacia') || desc.includes('farmácia') || desc.includes('drogaria') ||
        desc.includes('medico') || desc.includes('médico') || desc.includes('hospital') ||
        desc.includes('consulta')) {
        return { type: 'expense', category: 'Saúde' }
    }

    // Moradia
    if (desc.includes('aluguel') || desc.includes('condominio') || desc.includes('condomínio') ||
        desc.includes('agua') || desc.includes('água') || desc.includes('luz') ||
        desc.includes('energia') || desc.includes('internet')) {
        return { type: 'expense', category: 'Moradia' }
    }

    // Compra no débito/crédito
    if (desc.includes('compra no debito') || desc.includes('compra no débito') ||
        desc.includes('compra no credito') || desc.includes('compra no crédito') ||
        desc.includes('pagamento') || desc.includes('fatura')) {
        return { type: 'expense', category: 'Outros' }
    }

    // Salário/Renda
    if (desc.includes('salario') || desc.includes('salário') || desc.includes('deposito') ||
        desc.includes('depósito') || desc.includes('recebimento')) {
        return { type: 'income', category: 'Salário' }
    }

    // Default
    return { type: 'expense', category: 'Outros' }
}

// Parse amount from Brazilian format
// CRITICAL: Now supports NEGATIVE numbers!
function parseAmountBR(amountStr: string): number | null {
    try {
        let cleaned = amountStr
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\+/g, '')
            .trim()

        // Check if negative
        const isNegative = cleaned.startsWith('-')
        // Don't remove the negative sign yet if we want to parse it directly
        // But parseFloat handles negative signs fine.
        // The issue is formatting: 1.234,56

        // Remove minus first to clean formatting chars
        if (isNegative) {
            cleaned = cleaned.substring(1)
        }

        // Brazilian format: 1.234,56 -> need to convert to 1234.56
        // Remove thousand separator (.)
        cleaned = cleaned.replace(/\./g, '')
        // Replace decimal comma with dot
        cleaned = cleaned.replace(',', '.')

        const amount = parseFloat(cleaned)

        if (isNaN(amount)) return null

        return isNegative ? -amount : amount
    } catch {
        return null
    }
}

// Context for block-text parsing
interface ParsingContext {
    currentDate: string | null
}

// Enhanced local regex parsing function with Nubank support
function parseLineLocally(line: string, context: ParsingContext): Transaction | null {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Skip summary lines
    if (trimmed.toLowerCase().includes('total de entradas') ||
        trimmed.toLowerCase().includes('total de saídas') ||
        trimmed.toLowerCase().includes('saldo')) {
        return null
    }

    // PATTERN 0: Natural Language Input (PRIORITY!)
    // Example: "hoje gasolina 50" or "26.01 coxinha 2,5" or "ontem uber 15,50"
    const naturalPattern = /^(hoje|ontem|\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?)\s+(.+?)\s+((?:R\$\s?)?-?[\d]+(?:[.,]\d{1,2})?)$/i
    const naturalMatch = trimmed.match(naturalPattern)
    if (naturalMatch) {
        const dateInput = naturalMatch[1].toLowerCase()
        let date: string

        if (dateInput === 'hoje') {
            const today = new Date()
            date = today.toISOString().split('T')[0]
        } else if (dateInput === 'ontem') {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            date = yesterday.toISOString().split('T')[0]
        } else {
            // Parse DD.MM or DD/MM format
            const dateParts = dateInput.split(/[\/.]/)
            if (dateParts.length >= 2) {
                const day = dateParts[0].padStart(2, '0')
                const month = dateParts[1].padStart(2, '0')
                const year = dateParts[2] ? (dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]) : new Date().getFullYear().toString()
                date = `${year}-${month}-${day}`
            } else {
                return null
            }
        }

        const description = naturalMatch[2].trim()
        const amount = parseAmountBR(naturalMatch[3])

        // Allow negative amounts now!
        if (amount !== null && amount !== 0) {
            const { type, category } = categorizeByKeyword(description)
            console.log('✅ Natural input parsed:', { date, description, amount, type, category })
            return { date, description, amount, type, category }
        }
    }

    // PATTERN 1: Nubank CSV Format
    // Example: "21/01/2026,-46.00,card_not_present,Compra no débito - Sonda..."
    const csvPattern = /^(\d{2}\/\d{2}\/\d{4}),(-?\d+\.\d{2}),[^,]+,(.+)$/
    const csvMatch = trimmed.match(csvPattern)
    if (csvMatch) {
        const dateParts = csvMatch[1].split('/')
        const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` // YYYY-MM-DD
        const amount = parseFloat(csvMatch[2]) // Use direct float parse for CSV as it's standard format
        const description = csvMatch[3].trim()

        const { type, category } = categorizeByKeyword(description)
        return { date, description, amount, type, category }
    }

    // PATTERN 2: Date Header Detection (Nubank Block Text)
    // Example: "26 JAN 2026"
    const dateHeaderPattern = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{4})$/i
    const dateMatch = trimmed.match(dateHeaderPattern)
    if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0')
        const month = monthMap[dateMatch[2].toUpperCase()].toString().padStart(2, '0')
        const year = dateMatch[3]
        context.currentDate = `${year}-${month}-${day}`
        return null // This is just a date header, not a transaction
    }

    // PATTERN 3: Nubank Block Transaction
    // Example: "Compra no débito - Sonda Supermercados          46,00"
    // The value is at the end with spaces before it
    const blockPattern = /^(.+?)\s{2,}([\d\.,]+)$/
    const blockMatch = trimmed.match(blockPattern)
    if (blockMatch && context.currentDate) {
        const description = blockMatch[1].trim()
        const amount = parseAmountBR(blockMatch[2])

        if (amount !== null && amount !== 0) {
            const { type, category } = categorizeByKeyword(description)
            // Block text usually doesn't show negative signs for expenses, 
            // but we'll apply logic later.
            // If it DOES have sign, parseAmountBR handles it? 
            // The regex [\d\.,]+ doesn't capture minus sign in the block pattern!
            // Let's update regex if needed, but usually PDF block text is absolute.
            return {
                date: context.currentDate,
                description,
                amount,
                type,
                category
            }
        }
    }

    // PATTERN 4: Standard format DD/MM/YY - Description - Amount
    const standardPattern = /^([\d\/\.\-]+)\s*[\-\|]\s*(.+?)\s*[\-\|]\s*([\d\.,R\$\s\+\-]+)$/
    const standardMatch = trimmed.match(standardPattern)
    if (standardMatch) {
        const dateParts = standardMatch[1].split(/[\/\.\-]/)
        if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0')
            const month = dateParts[1].padStart(2, '0')
            let year = dateParts[2]
            if (year.length === 2) {
                year = `20${year}`
            }
            const date = `${year}-${month}-${day}`

            const description = standardMatch[2].trim()
            const amount = parseAmountBR(standardMatch[3])

            if (amount !== null && amount !== 0) {
                const { type, category } = categorizeByKeyword(description)
                return { date, description, amount, type, category }
            }
        }
    }

    return null
}

export async function processFinancialTextLogic(text: string, userId: string, supabase: SupabaseClient): Promise<ProcessResult> {
    try {
        console.log('🔍 Processing financial text logic...')

        // Validate input
        if (!text || text.trim().length === 0) {
            return {
                success: false,
                error: 'Por favor, cole um extrato para analisar.',
            }
        }

        // Split text into lines
        const lines = text.split('\n').filter(l => l.trim())

        // LOCAL PARSING FIRST with context
        const localTransactions: Transaction[] = []
        const unparsedLines: string[] = []
        const context: ParsingContext = { currentDate: null }

        for (const line of lines) {
            const parsed = parseLineLocally(line, context)
            if (parsed) {
                localTransactions.push(parsed)
                console.log('✅ Local parse:', line.substring(0, 60))
            } else {
                // Only add to unparsed if it's not a date header or summary line
                if (!line.match(/^\d{1,2}\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+\d{4}$/i) &&
                    !line.toLowerCase().includes('total de') &&
                    !line.toLowerCase().includes('saldo') &&
                    line.trim().length > 0) {
                    unparsedLines.push(line)
                }
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
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

                    // UPDATE PROMPT TO ALLOW NEGATIVE AND POSITIVE!
                    const prompt = `Você é o José, um assistente financeiro inteligente para usuários brasileiros.

TAREFA: Analise o extrato bancário abaixo e extraia TODAS as transações como um array JSON.

REGRAS CRÍTICAS DE SINAL E TIPO:

1. INVESTIMENTOS (type: 'investment'):
   - Aplicações (SAÍDA): "Aplicação", "CDB", "Poupança" -> Valor NEGATIVO (ex: -100.00).
   - Resgates (ENTRADA): "Resgate", "Rendimento" -> Valor POSITIVO (ex: 100.00).

2. RECEITAS (type: 'income'):
   - Valor POSITIVO (ex: 1500.00).
   - Salários, Pix recebido, Vendas.

3. DESPESAS (type: 'expense'):
   - Valor NEGATIVO (ex: -50.00).
   - Pix enviado, Compras, Boletos.

FORMATAÇÃO:
- DATAS: Converta para YYYY-MM-DD (exemplo: "05/01/26" → "2026-01-05")
- VALORES: Use o sinal correto (negativo para saídas, positivo para entradas).
- Use ponto decimal (.).

CRÍTICO: Retorne APENAS o array JSON. NÃO adicione texto, markdown ou explicações.

Formato: [{"date":"2026-01-05","description":"Descrição","amount":-50.00,"type":"expense","category":"Alimentação"}]

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
                error: 'Nenhuma transação encontrada. Verifique o formato do extrato.',
            }
        }

        console.log(`✅ Total extracted: ${allTransactions.length} transactions`)

        // APPLY SIMPLIFIED ACCOUNTING LOGIC
        console.log('💰 Applying simplified accounting logic (Income/Expense/Investment)...')
        for (const transaction of allTransactions) {
            // 1. CHECK FOR INVESTMENTS (The only exception to the rule)
            const investmentResult = categorizeInvestment(transaction.description, transaction.amount)
            if (investmentResult) {
                transaction.type = investmentResult.type
                transaction.category = investmentResult.category

                // FORCE SIGNS per user request:
                // Application = Negative (Outflow)
                // Redemption = Positive (Inflow)

                const lowerDesc = transaction.description.toLowerCase()
                const redemptionKeywords = ['resgate', 'resg', 'rendimento', 'resgate cdb', 'resgate rdb', 'dividendo']
                const isRedemption = redemptionKeywords.some(kw => lowerDesc.includes(kw))

                if (isRedemption) {
                    transaction.amount = Math.abs(transaction.amount) // Force Positive
                } else {
                    transaction.amount = -Math.abs(transaction.amount) // Force Negative (Application)
                }

                const flowType = transaction.amount > 0 ? 'Redemption' : 'Application'
                console.log(`  📈 Investment ${flowType}: "${transaction.description}" (${transaction.amount})`)
                continue
            }

            // 2. STANDARD RULE: 
            const keywordType = categorizeByKeyword(transaction.description).type

            if (keywordType === 'income') {
                transaction.type = 'income'
                transaction.amount = Math.abs(transaction.amount) // Force Positive
                // Fix generic transfer category
                if (transaction.category === 'Transferência') transaction.category = 'Receita'
            } else {
                transaction.type = 'expense'
                transaction.amount = -Math.abs(transaction.amount) // Force Negative
            }
        }

        // SMART CATEGORIZATION: Apply personal history and global hints
        console.log('🧠 Applying smart categorization...')
        for (const transaction of allTransactions) {
            const smartCategory = await smartCategorize(transaction.description, userId, supabase)
            if (smartCategory) {
                transaction.type = smartCategory.type
                transaction.category = smartCategory.category
                transaction.subcategory = smartCategory.subcategory || null
                console.log(`  ✅ Smart: "${transaction.description}" → ${smartCategory.category} (${smartCategory.subcategory || 'no sub'})`)
            }
        }

        // Check for duplicates
        const { data: existingTransactions } = await supabase
            .from('transactions')
            .select('date, amount, description')
            .eq('user_id', userId)

        const duplicates: Transaction[] = []
        const newTransactions: Transaction[] = []

        for (const transaction of allTransactions) {
            const isDuplicate = existingTransactions?.some(existing => {
                const sameDate = existing.date === transaction.date
                // Compare with small epsilon
                const sameAmount = Math.abs(existing.amount - transaction.amount) < 0.01
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
                duplicates: duplicates.length > 0 ? duplicates : undefined,
            }
        }

        // Insert new transactions
        const transactionsToInsert = newTransactions.map(t => ({
            user_id: userId,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            subcategory: t.subcategory || null,
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
        console.error('❌ Error processing financial text logic:', error)

        if (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503')) {
            return {
                success: false,
                error: 'O José está sobrecarregado. Mas você pode usar o formato CSV do Nubank ou texto direto!',
            }
        }

        return {
            success: false,
            error: `Erro: ${error.message}`,
        }
    }
}
