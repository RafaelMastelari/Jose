'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, uploadAvatar, updateProfile, deleteAccount } from '@/app/actions/settings-actions'
import { createClient } from '@/lib/supabase'

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

export default function SettingsPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    // Form states
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [weeklySummary, setWeeklySummary] = useState(true)
    const [newWisdom, setNewWisdom] = useState(true)
    const [hideBalance, setHideBalance] = useState(false)

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        const result = await getProfile()

        if (result.success && result.profile) {
            setProfile(result.profile)
            setFullName(result.profile.full_name || '')
            setPhone(result.profile.phone || '')
            setWeeklySummary(result.profile.preferences.weekly_summary)
            setNewWisdom(result.profile.preferences.new_wisdom)
            setHideBalance(result.profile.preferences.hide_balance)
        }

        setLoading(false)
    }

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingAvatar(true)

        const formData = new FormData()
        formData.append('avatar', file)

        const result = await uploadAvatar(formData)

        if (result.success) {
            showToast('Foto atualizada ✓')
            loadProfile()
        } else {
            showToast(result.error || 'Erro ao enviar foto', 'error')
        }

        setUploadingAvatar(false)
    }

    const handleSaveProfile = async () => {
        const result = await updateProfile({
            full_name: fullName,
            phone: phone,
        })

        if (result.success) {
            showToast('Perfil atualizado ✓')
        } else {
            showToast(result.error || 'Erro ao salvar', 'error')
        }
    }

    const handleTogglePreference = async (key: 'weekly_summary' | 'new_wisdom' | 'hide_balance', value: boolean) => {
        const result = await updateProfile({
            preferences: { [key]: value },
        })

        if (result.success) {
            if (key === 'weekly_summary') setWeeklySummary(value)
            if (key === 'new_wisdom') setNewWisdom(value)
            if (key === 'hide_balance') setHideBalance(value)
            showToast('Preferência atualizada')
        } else {
            showToast(result.error || 'Erro ao salvar', 'error')
        }
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleDeleteAccount = async () => {
        const result = await deleteAccount()

        if (result.success) {
            router.push('/login')
        } else {
            showToast(result.error || 'Erro ao excluir conta', 'error')
        }
    }

    // Get initials for avatar fallback
    const getInitials = (name: string | null) => {
        if (!name) return '👤'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-ice)]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20 bg-[var(--color-background-ice)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Configurações</h1>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
                {/* Avatar Section */}
                <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center">
                    <div className="relative">
                        <button
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--color-primary)]/10 flex items-center justify-center hover:opacity-80 transition-opacity"
                        >
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-[var(--color-primary)]">
                                    {getInitials(profile?.full_name)}
                                </span>
                            )}

                            {uploadingAvatar && (
                                <div className="absolute inset-0  bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                </div>
                            )}
                        </button>

                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white !text-[14px]">photo_camera</span>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />

                    <p className="text-lg font-semibold text-[var(--color-text-main)] mt-4">
                        {profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-sm text-[var(--color-text-sub)]">
                        Toque na foto para alterar
                    </p>
                </div>

                {/* Profile Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <div className="px-6 py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-blue-500 !text-[20px]">person</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    onBlur={handleSaveProfile}
                                    placeholder="Seu nome"
                                    className="text-base font-semibold text-[var(--color-text-main)] w-full outline-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-green-500 !text-[20px]">phone</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Telefone</p>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onBlur={handleSaveProfile}
                                    placeholder="(00) 00000-0000"
                                    className="text-base font-semibold text-[var(--color-text-main)] w-full outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notificações</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-500 !text-[20px]">email</span>
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-[var(--color-text-main)]">Resumo Semanal</p>
                                    <p className="text-xs text-gray-500">Receba análises por email</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleTogglePreference('weekly_summary', !weeklySummary)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${weeklySummary ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${weeklySummary ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-500 !text-[20px]">history_edu</span>
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-[var(--color-text-main)]">Novas Sabedorias</p>
                                    <p className="text-xs text-gray-500">Avisos de novos conselhos</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleTogglePreference('new_wisdom', !newWisdom)}
                                className={`relative w-12 h-7 rounded-full transition-colors ${newWisdom ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${newWisdom ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Privacidade</h3>
                    </div>

                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-600 !text-[20px]">visibility_off</span>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-[var(--color-text-main)]">Ocultar Saldo</p>
                                <p className="text-xs text-gray-500">Valores aparecem borrados</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleTogglePreference('hide_balance', !hideBalance)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${hideBalance ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                                }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${hideBalance ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Zona de Perigo</h3>
                    </div>

                    <div className="p-6 space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold text-[var(--color-text-main)] hover:bg-gray-50 transition-colors"
                        >
                            Sair da Conta
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-3 font-semibold text-red-600 hover:text-red-700 transition-colors"
                        >
                            Excluir Conta Permanentemente
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-red-500 !text-[32px]">
                                    warning
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                                Excluir Conta?
                            </h3>
                            <p className="text-[var(--color-text-sub)]">
                                Todos os seus dados serão permanentemente excluídos. Esta ação não pode ser desfeita.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-[var(--color-text-main)] hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
                    <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${toast.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                        <span className="material-symbols-outlined !text-[20px]">
                            {toast.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, 20px);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    )
}
