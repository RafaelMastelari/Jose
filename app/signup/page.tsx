'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignUpPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // Redirect to login with success message
        router.push('/login?message=Check your email to confirm your account')
    }

    return (
        <div className="bg-[#f5f8f8] min-h-screen flex flex-col overflow-x-hidden text-[#111818] antialiased">
            {/* Status Bar Area */}
            <div className="h-12 w-full flex-shrink-0"></div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full justify-center pb-8">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-8 gap-6">
                    {/* Icon Container with Lock Sphere - Same as Welcome Page */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        {/* Main Sphere */}
                        <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-lg border-2 border-[var(--color-primary)]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[var(--color-primary)] !text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                lock
                            </span>
                        </div>

                        {/* Orbiting Elements */}
                        <div className="absolute inset-0 animate-[orbit_8s_linear_infinite]">
                            <div className="absolute top-0 left-1/2 -ml-1.5 w-3 h-3 rounded-full bg-[var(--color-mint-green)] shadow-md"></div>
                        </div>
                        <div className="absolute inset-0 animate-[orbit_12s_linear_infinite]" style={{ animationDirection: 'reverse' }}>
                            <div className="absolute top-0 left-1/2 -ml-1.5 w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-md"></div>
                        </div>

                        {/* Rotating Dashed Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--color-primary)]/20 animate-[spin_12s_linear_infinite]"></div>

                        {/* Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full border border-[var(--color-primary)]/20 shadow-sm">
                            <span className="text-[10px] font-bold text-[var(--color-primary)] tracking-wide uppercase">Seguro</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[#006064] tracking-tight text-[28px] font-extrabold leading-tight text-center">
                        Comece sua jornada com José
                    </h1>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleSignUp} className="flex flex-col gap-5 w-full">
                    {/* Name Field */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[#006064] ml-1" htmlFor="name">
                            Nome
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#006064] transition-colors !text-[20px]">person</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-4 bg-white border border-[#dbe6e6] rounded-xl text-base text-[#111818] placeholder-gray-400 focus:outline-none focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] transition-all shadow-sm"
                                id="name"
                                name="name"
                                placeholder="Seu nome completo"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[#006064] ml-1" htmlFor="email">
                            Email
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#006064] transition-colors !text-[20px]">mail</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-4 bg-white border border-[#dbe6e6] rounded-xl text-base text-[#111818] placeholder-gray-400 focus:outline-none focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] transition-all shadow-sm"
                                id="email"
                                name="email"
                                placeholder="exemplo@email.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[#006064] ml-1" htmlFor="password">
                            Senha
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#006064] transition-colors !text-[20px]">lock</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-12 py-4 bg-white border border-[#dbe6e6] rounded-xl text-base text-[#111818] placeholder-gray-400 focus:outline-none focus:border-[#0df2f2] focus:ring-1 focus:ring-[#0df2f2] transition-all shadow-sm"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#006064] transition-colors"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="material-symbols-outlined !text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        className="mt-4 w-full bg-[#006064] hover:bg-[#00838f] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#006064]/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                    >
                        <span>{loading ? 'Criando conta...' : 'Criar Conta'}</span>
                        <span className="material-symbols-outlined !text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center space-y-6">
                    <p className="text-sm text-gray-500">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="font-bold text-[#006064] hover:underline transition-colors">
                            Entre aqui
                        </Link>
                    </p>
                    <div className="flex items-center justify-center gap-2 opacity-60">
                        <span className="material-symbols-outlined !text-[16px] text-gray-400">verified_user</span>
                        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Secured by Blue Nile Tech</span>
                    </div>
                </div>
            </main>

            {/* Bottom Safe Area */}
            <div className="h-6 w-full flex-shrink-0"></div>

            {/* CSS Animations */}
            <style jsx>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(50px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(50px) rotate(-360deg);
          }
        }
      `}</style>
        </div>
    )
}
