'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface Transaction {
    id: string
    user_id: string
    date: string
    description: string
    amount: number
    type: 'income' | 'expense' | 'investment' | 'transfer'
    category: string
    created_at: string
    updated_at: string
}

interface UpdateTransactionData {
    date?: string
    description?: string
    amount?: number
    type?: 'income' | 'expense' | 'investment' | 'transfer'
    category?: string
}

interface TransactionResult {
    success: boolean
    data?: Transaction[]
    transaction?: Transaction
    error?: string
}

/**
 * Get transactions with optional month/year filtering
 */
export async function getTransactions(month?: number, year?: number): Promise<TransactionResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })

        // Apply month/year filters if provided
        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0)

            const startDateStr = startDate.toISOString().split('T')[0]
            const endDateStr = endDate.toISOString().split('T')[0]

            query = query.gte('date', startDateStr).lte('date', endDateStr)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching transactions:', error)
            return {
                success: false,
                error: 'Erro ao buscar transações.',
            }
        }

        return {
            success: true,
            data: data || [],
        }
    } catch (error: any) {
        console.error('Error in getTransactions:', error)
        return {
            success: false,
            error: error.message || 'Erro ao buscar transações.',
        }
    }
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string): Promise<TransactionResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error) {
            console.error('Error fetching transaction:', error)
            return {
                success: false,
                error: 'Transação não encontrada.',
            }
        }

        return {
            success: true,
            transaction: data,
        }
    } catch (error: any) {
        console.error('Error in getTransactionById:', error)
        return {
            success: false,
            error: error.message || 'Erro ao buscar transação.',
        }
    }
}

/**
 * Update a transaction
 */
export async function updateTransaction(
    id: string,
    updateData: UpdateTransactionData
): Promise<TransactionResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Verify ownership before update
        const { data: existing } = await supabase
            .from('transactions')
            .select('user_id')
            .eq('id', id)
            .single()

        if (!existing || existing.user_id !== user.id) {
            return {
                success: false,
                error: 'Transação não encontrada ou sem permissão.',
            }
        }

        // Update transaction
        const { data, error } = await supabase
            .from('transactions')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating transaction:', error)
            return {
                success: false,
                error: 'Erro ao atualizar transação.',
            }
        }

        // Revalidate dashboard and transactions pages
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/transactions')

        return {
            success: true,
            transaction: data,
        }
    } catch (error: any) {
        console.error('Error in updateTransaction:', error)
        return {
            success: false,
            error: error.message || 'Erro ao atualizar transação.',
        }
    }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<TransactionResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Verify ownership before delete
        const { data: existing } = await supabase
            .from('transactions')
            .select('user_id')
            .eq('id', id)
            .single()

        if (!existing || existing.user_id !== user.id) {
            return {
                success: false,
                error: 'Transação não encontrada ou sem permissão.',
            }
        }

        // Delete transaction
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error deleting transaction:', error)
            return {
                success: false,
                error: 'Erro ao excluir transação.',
            }
        }

        // Revalidate dashboard and transactions pages
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/transactions')

        return {
            success: true,
        }
    } catch (error: any) {
        console.error('Error in deleteTransaction:', error)
        return {
            success: false,
            error: error.message || 'Erro ao excluir transação.',
        }
    }
}
