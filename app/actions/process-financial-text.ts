'use server'

import { createClient } from '@/lib/supabase-server'
import { processFinancialTextLogic, ProcessResult } from '@/app/lib/financial-processing'

export async function processFinancialText(text: string): Promise<ProcessResult> {
    try {
        console.log('🔄 Calling shared financial processing logic via Server Action...')

        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado. Faça login novamente.',
            }
        }

        // Delegate to the shared logic
        return await processFinancialTextLogic(text, user.id, supabase)

    } catch (error: any) {
        console.error('❌ Error in Server Action:', error)
        return {
            success: false,
            error: `Erro inesperado: ${error.message}`
        }
    }
}
