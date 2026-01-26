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
    subcategory?: string
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

// Slugify helper for category learning
function slugify(text: string): string {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim()
}

/**
 * Update transaction with category learning (cascade + global hints)
 */
export async function updateTransactionWithLearning(
    id: string,
    updateData: UpdateTransactionData,
    updateSimilar: boolean = false
): Promise<TransactionResult & { updatedCount?: number }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Get original transaction
        const { data: original, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !original) {
            return {
                success: false,
                error: 'Transação não encontrada.',
            }
        }

        let updatedCount = 0

        // CASCADE UPDATE: Apply to similar transactions
        if (updateSimilar && updateData.category && updateData.category !== original.category) {
            const { count, error: cascadeError } = await supabase
                .from('transactions')
                .update({
                    category: updateData.category,
                    type: updateData.type || original.type,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('description', original.description)

            if (!cascadeError) {
                updatedCount = count || 0
                console.log(`✅ Cascade: Updated ${updatedCount} similar transactions`)
            }
        } else {
            // Single update
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('user_id', user.id)

            if (updateError) {
                return {
                    success: false,
                    error: 'Erro ao atualizar transação.',
                }
            }
            updatedCount = 1
        }

        // GLOBAL LEARNING: Upsert to global_category_hints
        if (updateData.category && updateData.category !== original.category) {
            const slug = slugify(original.description)

            // Try to increment existing or insert new
            const { data: existing } = await supabase
                .from('global_category_hints')
                .select('votes')
                .eq('description_slug', slug)
                .eq('category', updateData.category)
                .single()

            if (existing) {
                // Increment votes
                await supabase
                    .from('global_category_hints')
                    .update({
                        votes: existing.votes + 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('description_slug', slug)
                    .eq('category', updateData.category)
            } else {
                // Insert new hint
                await supabase
                    .from('global_category_hints')
                    .insert({
                        description_slug: slug,
                        category: updateData.category,
                        votes: 1,
                        updated_at: new Date().toISOString(),
                    })
            }

            console.log(`🧠 Global learning: "${original.description}" → ${updateData.category}`)
        }

        // Revali date pages
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/transactions')

        return {
            success: true,
            updatedCount,
        }
    } catch (error: any) {
        console.error('Error in updateTransactionWithLearning:', error)
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
