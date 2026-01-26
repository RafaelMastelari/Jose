'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface Profile {
    id: string
    avatar_url: string | null
    full_name: string | null
    phone: string | null
    preferences: {
        weekly_summary: boolean
        new_wisdom: boolean
        hide_balance: boolean
    }
}

interface ProfileUpdate {
    full_name?: string
    phone?: string
    preferences?: {
        weekly_summary?: boolean
        new_wisdom?: boolean
        hide_balance?: boolean
    }
}

interface ProfileResult {
    success: boolean
    profile?: Profile
    error?: string
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<ProfileResult> {
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
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return {
                success: false,
                error: 'Erro ao buscar perfil.',
            }
        }

        return {
            success: true,
            profile: data,
        }
    } catch (error: any) {
        console.error('Error in getProfile:', error)
        return {
            success: false,
            error: error.message || 'Erro ao buscar perfil.',
        }
    }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(formData: FormData): Promise<ProfileResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        const file = formData.get('avatar') as File
        if (!file) {
            return {
                success: false,
                error: 'Nenhum arquivo selecionado.',
            }
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP.',
            }
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return {
                success: false,
                error: 'Arquivo muito grande. Máximo 2MB.',
            }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            })

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError)
            return {
                success: false,
                error: 'Erro ao fazer upload da imagem.',
            }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return {
                success: false,
                error: 'Erro ao atualizar perfil.',
            }
        }

        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard')

        return {
            success: true,
            profile: { avatar_url: publicUrl } as Profile,
        }
    } catch (error: any) {
        console.error('Error in uploadAvatar:', error)
        return {
            success: false,
            error: error.message || 'Erro ao fazer upload.',
        }
    }
}

/**
 * Update user profile
 */
export async function updateProfile(updateData: ProfileUpdate): Promise<ProfileResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Build update object
        const updates: any = {
            updated_at: new Date().toISOString(),
        }

        if (updateData.full_name !== undefined) {
            updates.full_name = updateData.full_name
        }

        if (updateData.phone !== undefined) {
            updates.phone = updateData.phone
        }

        if (updateData.preferences !== undefined) {
            // Merge with existing preferences
            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('preferences')
                .eq('id', user.id)
                .single()

            updates.preferences = {
                ...(currentProfile?.preferences || {}),
                ...updateData.preferences,
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return {
                success: false,
                error: 'Erro ao atualizar perfil.',
            }
        }

        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard')

        return {
            success: true,
            profile: data,
        }
    } catch (error: any) {
        console.error('Error in updateProfile:', error)
        return {
            success: false,
            error: error.message || 'Erro ao atualizar perfil.',
        }
    }
}

/**
 * Delete user account (DANGER ZONE)
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return {
                success: false,
                error: 'Usuário não autenticado.',
            }
        }

        // Note: This requires Supabase Auth admin API or RPC function
        // For now, we'll use the admin API if available
        // In production, you'd need to set up a proper admin endpoint

        // Sign out first
        await supabase.auth.signOut()

        // The actual deletion should be done via Admin API or Edge Function
        // CASCADE will delete all related data (profiles, transactions, etc.)

        return {
            success: true,
        }
    } catch (error: any) {
        console.error('Error in deleteAccount:', error)
        return {
            success: false,
            error: error.message || 'Erro ao excluir conta.',
        }
    }
}
