'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
            return
        }

        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (oauthError) {
                setError(oauthError.message)
                setLoading(false)
            }
            // If successful, user will be redirected to Google
        } catch (err) {
            console.error('OAuth error:', err)
            setError('Erro ao conectar com Google. Verifique se OAuth está habilitado no Supabase.')
            setLoading(false)
        }
    }

    return (
        <div className="bg-[#f6f8f8] min-h-screen flex flex-col relative overflow-x-hidden text-[#111817]">
            {/* Top Navigation */}
            <div className="flex items-center p-4 justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[#0f3d39]">arrow_back</span>
                </button>
            </div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col justify-center px-6 max-w-[480px] mx-auto w-full pb-8">
                {/* Header Section: Icon & Title */}
                <div className="flex flex-col items-center mb-10 space-y-6">
                    {/* Vault/Lock Icon */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        {/* Decorative background blob */}
                        <div className="absolute inset-0 bg-[#11d4c4]/20 rounded-2xl rotate-3"></div>
                        {/* Icon container */}
                        <div className="relative bg-white w-full h-full rounded-2xl flex items-center justify-center shadow-sm border border-[#e5e7eb]">
                            <span className="material-symbols-outlined text-[#0f3d39] !text-[48px]" style={{ fontVariationSettings: "'FILL' 0" }}>lock_open_right</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[#0f3d39] tracking-tight text-[32px] font-bold leading-tight text-center">
                        Bem-vindo de volta ao José
                    </h1>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                        <span className="material-symbols-outlined !text-[20px] flex-shrink-0">error</span>
                        <div>
                            <p className="font-semibold mb-1">Erro ao fazer login</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleLogin} className="space-y-5 w-full">
                    {/* Email Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[#0f3d39] text-base font-medium leading-normal ml-1">
                            Email
                        </label>
                        <input
                            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-[#111817] focus:outline-0 focus:ring-2 focus:ring-[#11d4c4]/50 border border-[#dbe6e5] bg-white h-14 placeholder:text-[#618986] px-[15px] text-base font-normal leading-normal transition-all duration-200"
                            placeholder="seu@email.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[#0f3d39] text-base font-medium leading-normal ml-1">
                                Senha
                            </label>
                        </div>
                        <div className="flex w-full items-center rounded-lg border border-[#dbe6e5] bg-white focus-within:ring-2 focus-within:ring-[#11d4c4]/50 focus-within:border-[#11d4c4] transition-all duration-200 overflow-hidden h-14">
                            <input
                                className="form-input flex-1 min-w-0 border-none bg-transparent text-[#111817] focus:ring-0 placeholder:text-[#618986] px-[15px] text-base font-normal leading-normal h-full"
                                placeholder="Sua senha"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="flex items-center justify-center px-4 text-[#0f3d39] hover:text-[#11d4c4] transition-colors h-full outline-none focus:outline-none"
                            >
                                <span className="material-symbols-outlined !text-[24px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end mt-1">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-semibold text-[#11d4c4] hover:text-[#0d9e92] transition-colors"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                    </div>

                    <div className="h-2"></div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-4">
                        {/* Primary Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg bg-[#0f3d39] h-14 px-4 text-white text-base font-bold leading-normal shadow-md shadow-[#0f3d39]/10 hover:shadow-lg hover:shadow-[#0f3d39]/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>

                        {/* Divider */}
                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">ou</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Google Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg border border-[#dbe6e5] bg-white h-14 px-4 text-[#111817] text-base font-bold leading-normal hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
                                <path d="M12.24 24.0008C15.4765 24.0008 18.2058 22.9382 20.19 21.1039L16.323 18.1056C15.251 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853"></path>
                                <path d="M5.50253 14.3003C5.00236 12.8199 5.00236 11.1799 5.50253 9.69967V6.60879H1.5166C-0.18551 10.0056 -0.18551 13.9945 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
                                <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.60879L5.50253 9.69967C6.45064 6.86106 9.10447 4.74966 12.24 4.74966Z" fill="#EA4335"></path>
                            </svg>
                            Entrar com Google
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-auto pt-8 text-center">
                    <p className="text-[#618986] text-sm font-medium">
                        Ainda não tem conta?{' '}
                        <Link href="/signup" className="text-[#0f3d39] font-bold hover:underline">
                            Crie agora
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
