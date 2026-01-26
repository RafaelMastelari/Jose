'use server'

import { processFinancialText } from './process-financial-text'
// @ts-ignore - pdf-parse doesn't have types
import pdf from 'pdf-parse'

interface UploadResult {
    success: boolean
    message?: string
    transactions?: any[]
    duplicates?: any[]
    error?: string
}

// Parse OFX format (Nubank XML-based)
function parseOFX(content: string): string {
    try {
        const lines: string[] = []

        // Match all <STMTTRN>...</STMTTRN> blocks
        const transactionBlocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || []

        for (const block of transactionBlocks) {
            // Extract date (DTPOSTED: YYYYMMDD format)
            const dateMatch = block.match(/<DTPOSTED>(\d{8})/)
            if (!dateMatch) continue

            const dateStr = dateMatch[1]
            const year = dateStr.substring(0, 4)
            const month = dateStr.substring(4, 6)
            const day = dateStr.substring(6, 8)
            const formattedDate = `${day}/${month}/${year}`

            // Extract amount
            const amountMatch = block.match(/<TRNAMT>([\-\d\.]+)/)
            const amount = amountMatch ? amountMatch[1] : '0'

            // Extract description (MEMO or NAME) - fixed null safety
            const memoMatch = block.match(/<MEMO>(.*?)</)
            const nameMatch = block.match(/<NAME>(.*?)</)
            const description = (memoMatch?.[1] || nameMatch?.[1] || 'Transação').trim()

            // Format as simple text line for our parser
            lines.push(`${formattedDate} - ${description} - ${amount}`)
        }

        return lines.join('\n')
    } catch (error) {
        console.error('Error parsing OFX:', error)
        throw new Error('Erro ao processar arquivo OFX')
    }
}

// Parse PDF using pdf-parse
async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer)
        // pdf-parse returns the full text content
        return data.text
    } catch (error) {
        console.error('Error parsing PDF:', error)
        throw new Error('Erro ao processar arquivo PDF')
    }
}

export async function uploadStatement(formData: FormData): Promise<UploadResult> {
    try {
        console.log('📁 Processing uploaded file...')

        const file = formData.get('file') as File

        if (!file) {
            return {
                success: false,
                error: 'Nenhum arquivo enviado.',
            }
        }

        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
        })

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return {
                success: false,
                error: 'Arquivo muito grande. Máximo: 10MB.',
            }
        }

        // Detect file type by extension
        const filename = file.name.toLowerCase()
        let textContent = ''

        if (filename.endsWith('.ofx')) {
            console.log('📄 Detected OFX format')
            const content = await file.text()
            textContent = parseOFX(content)
        } else if (filename.endsWith('.csv')) {
            console.log('📄 Detected CSV format')
            // CSV is already text, but Nubank CSV might have header
            const content = await file.text()
            // Remove first line if it's a header (contains "date" or "data")
            const lines = content.split('\n')
            if (lines[0].toLowerCase().includes('date') ||
                lines[0].toLowerCase().includes('data') ||
                lines[0].toLowerCase().includes('valor')) {
                textContent = lines.slice(1).join('\n')
            } else {
                textContent = content
            }
        } else if (filename.endsWith('.pdf')) {
            console.log('📄 Detected PDF format')
            const buffer = Buffer.from(await file.arrayBuffer())
            textContent = await parsePDF(buffer)
        } else {
            return {
                success: false,
                error: 'Formato não suportado. Use .ofx, .csv ou .pdf',
            }
        }

        if (!textContent || textContent.trim().length === 0) {
            return {
                success: false,
                error: 'Arquivo vazio ou sem transações.',
            }
        }

        console.log('📝 Extracted text length:', textContent.length)
        console.log('Preview:', textContent.substring(0, 200))

        // Process extracted text with our existing hybrid parser
        const result = await processFinancialText(textContent)

        // Return with duplicates field
        return {
            ...result,
            duplicates: result.duplicates || []
        }
    } catch (error: any) {
        console.error('❌ Error uploading statement:', error)
        return {
            success: false,
            error: `Erro ao processar arquivo: ${error.message}`,
        }
    }
}
