'use server'

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
    timestamp?: string
    error?: string
}

export async function getLastWisdom(): Promise<WisdomResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.'
            }
        }

        // Fetch the last wisdom for this user
        const { data, error } = await supabase
            .from('wisdom_history')
            .select('content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            // If no wisdom found, return success: false but no error
            if (error.code === 'PGRST116') {
                console.log('ℹ️ No wisdom history found for user')
                return {
                    success: false,
                    wisdom: undefined
                }
            }

            console.error('❌ Error fetching wisdom:', error.message)
            return {
                success: false,
                error: 'Erro ao carregar sabedoria.'
            }
        }

        console.log('✅ Last wisdom loaded from database')
        return {
            success: true,
            wisdom: data.content as StructuredWisdom,
            timestamp: data.created_at
        }
    } catch (error: any) {
        console.error('❌ Error in getLastWisdom:', error.message)
        return {
            success: false,
            error: 'Erro ao carregar sabedoria.'
        }
    }
}
