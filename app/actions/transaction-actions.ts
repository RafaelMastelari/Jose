'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export interface Transaction {
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
    subcategory?: string | null
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
export async function getTransactions(
    month?: number,
    year?: number,
    type?: string,
    category?: string
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

        // Apply type filter
        if (type && type !== 'all') {
            query = query.eq('type', type)
        }

        // Apply category filter
        if (category && category !== 'all') {
            query = query.eq('category', category)
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
        console.log('🔍 [updateTransaction] Received update data:', {
            transactionId: id,
            updateData,
            subcategory: updateData.subcategory,
            subcategoryType: typeof updateData.subcategory
        })

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
        const updatePayload = {
            ...updateData,
            updated_at: new Date().toISOString(),
        }

        console.log('📤 [updateTransaction] Sending to Supabase:', updatePayload)

        const { data, error } = await supabase
            .from('transactions')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('❌ [updateTransaction] Supabase error:', error)
            return {
                success: false,
                error: 'Erro ao atualizar transação.',
            }
        }

        console.log('✅ [updateTransaction] Success! Updated transaction:', {
            id: data.id,
            category: data.category,
            subcategory: data.subcategory
        })

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
        console.log('🚀 [updateTransaction] Starting...', { id, updateData, updateSimilar })

        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // --- STEP 1: DATA NORMALIZATION ---
        // Get original transaction first
        const { data: original, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !original) {
            return { success: false, error: 'Transação não encontrada.' }
        }

        const descriptionToSlug = updateData.description || original.description
        const descriptionSlug = slugify(descriptionToSlug)
        const finalCategory = updateData.category || original.category
        const finalSubcategory = updateData.subcategory // Can be null, which is valid

        console.log('Step 1: Normalization', { descriptionSlug, finalCategory, finalSubcategory })

        // --- STEP 2: UPDATE CURRENT TRANSACTION (FORCE TYPE) ---
        // Logic: Income group forces type='income', else type='expense'
        // We check against 'income' key primarily.
        const isIncome = finalCategory === 'income' || finalCategory === 'Receitas'
        const forceType = isIncome ? 'income' : 'expense'

        // Prepare payload
        const updatePayload = {
            ...updateData,
            category: finalCategory,
            subcategory: finalSubcategory,
            type: forceType, // CRITICAL: Force type based on category
            updated_at: new Date().toISOString(),
        }

        console.log('Step 2: Update Payload', updatePayload)

        const { error: updateError } = await supabase
            .from('transactions')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', user.id)

        if (updateError) {
            console.error('❌ Error updating transaction:', updateError)
            return { success: false, error: 'Erro ao atualizar transação.' }
        }

        // --- STEP 3: LEARNING (UPSERT) ---
        // Upsert into global_category_hints
        // Note: subcategory can be null. coalesce handled by DB unique index unique constraint logic usually,
        // but for specific insert we pass null safely.

        console.log('Step 3: Learning (Upserting hint)...')

        const hintPayload = {
            description_slug: descriptionSlug,
            category: finalCategory,
            subcategory: finalSubcategory, // Pass as is (string or null)
            votes: 1, // Default for new
            updated_at: new Date().toISOString()
        }

        // We use raw SQL or RPC ideally for atomic upsert with vote increment, 
        // but Supabase JS .upsert() works if we match the primary key / unique constraint.
        // The unique constraint is on (description_slug, category, COALESCE(subcategory, ''))
        // .upsert() might strictly need all columns to match.
        // Since we want to increment votes, we might need a stored procedure or fetch-then-update logic 
        // if upsert doesn't support "votes = votes + 1".
        // Supabase upsert just replaces by default. To increment, we need RPC or 2 calls.

        // Simulating UPSERT with increment logic:
        // Try to find existing first (to get current votes)
        // Actually, the user PROMPT requested a specific SQL:
        // ON CONFLICT DO UPDATE SET votes = global_category_hints.votes + 1

        // Since we are using Supabase JS client, we can't easily run raw complex SQL with "votes + 1" for various reasons without RPC.
        // So we will do the robust fetch-modify-save approach which is safe enough for this scale.

        // Check for existing hint
        let query = supabase
            .from('global_category_hints')
            .select('*')
            .eq('description_slug', descriptionSlug)
            .eq('category', finalCategory)

        if (finalSubcategory) {
            query = query.eq('subcategory', finalSubcategory)
        } else {
            query = query.is('subcategory', null)
        }

        const { data: existingHint } = await query.single()

        if (existingHint) {
            // Update
            await supabase
                .from('global_category_hints')
                .update({
                    votes: existingHint.votes + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('description_slug', descriptionSlug)
                .eq('category', finalCategory)
                .is('subcategory', finalSubcategory || null)
            // Note: .is is needed for null check equality in PostgREST but .eq usually handles it if passed null? 
            // Supabase JS .eq('col', null) -> IS NULL
            // So we can use .eq('subcategory', finalSubcategory) generally
        } else {
            // Insert
            await supabase
                .from('global_category_hints')
                .insert(hintPayload)
        }

        // --- STEP 4: CASCADE EFFECT ---
        let updatedCount = 1

        if (updateSimilar) {
            console.log('Step 4: Cascade (Updating similar)...')

            // We match by description text because we don't have description_slug on transactions table
            // But we can approximate by slugifying or just exact match on description?
            // The prompt said: WHERE description_slug = $4
            // Since we don't have that column, we'll assume the intention is "Same Description"
            // We will match original.description (or the new one if changed)

            const targetDescription = descriptionToSlug // Using the text

            const cascadePayload = {
                category: finalCategory,
                subcategory: finalSubcategory,
                type: forceType,
                updated_at: new Date().toISOString(),
            }

            const { count, error: cascadeError } = await supabase
                .from('transactions')
                .update(cascadePayload)
                .eq('user_id', user.id)
                .eq('description', targetDescription) // Using description text
                .neq('id', id)

            if (cascadeError) {
                console.error('❌ Cascade error:', cascadeError)
            } else {
                updatedCount += (count || 0)
                console.log(`✅ Cascade updated ${count} similar items`)
            }
        }

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

/**
 * Create a balance adjustment transaction
 */
export async function createBalanceAdjustment(difference: number): Promise<TransactionResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        const isIncome = difference > 0
        const amount = Math.abs(difference)

        // Check if there's already an adjustment today to prevent duplicates
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .eq('description', 'Ajuste de Saldo')
            .eq('amount', amount) // Check same amount to be safe
            .single()

        if (existing) {
            return {
                success: false,
                error: 'Já existe um ajuste de saldo idêntico hoje.',
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                description: 'Ajuste de Saldo',
                amount: amount,
                type: isIncome ? 'income' : 'expense',
                category: 'Ajuste',
                subcategory: null,
                date: today,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating balance adjustment:', error)
            return {
                success: false,
                error: 'Erro ao criar ajuste de saldo.',
            }
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/transactions')

        return {
            success: true,
            transaction: data,
        }
    } catch (error: any) {
        console.error('Error in createBalanceAdjustment:', error)
        return {
            success: false,
            error: error.message || 'Erro ao criar ajuste.',
        }
    }
}
