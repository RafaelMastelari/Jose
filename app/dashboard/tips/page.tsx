'use client'

import { useState } from 'react'
import { generateWisdom } from '@/app/actions/generate-wisdom'

export default function TipsPage() {
    const [wisdom, setWisdom] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGenerateWisdom = async () => {
        setError('')
        setIsLoading(true)

        try {
            const result = await generateWisdom()

            if (result.success) {
                setWisdom(result.wisdom || '')
            } else {
                setError(result.error || 'Erro ao gerar sabedoria.')
            }
        } catch (err) {
            setError('Erro ao gerar sabedoria. Tente novamente.')
            console.error('Wisdom generation error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-ice-blue pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-mint-green/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-mint-green" style={{ fontVariationSettings: "'FILL' 1" }}>
                            history_edu
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-charcoal">Sabedoria de José</h1>
                        <p className="text-sm text-gray-600">Conselhos financeiros com sabedoria bíblica</p>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-2xl mx-auto">
                {/* Main Wisdom Card */}
                <div className="bg-gradient-to-br from-amber-50 via-white to-mint-green-50 rounded-2xl p-8 shadow-xl border-2 border-amber-200/50 mb-6">
                    {/* Decorative Top */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center gap-2 text-amber-700">
                            <span className="material-symbols-outlined !text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                history_edu
                            </span>
                            <div className="h-0.5 w-12 bg-gradient-to-r from-amber-400 to-transparent"></div>
                            <span className="text-xs font-semibold uppercase tracking-wider">Conselho do Dia</span>
                            <div className="h-0.5 w-12 bg-gradient-to-l from-amber-400 to-transparent"></div>
                        </div>
                    </div>

                    {/* Wisdom Content */}
                    {!wisdom && !error && !isLoading && (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-[64px] text-amber-300 mb-4 block">
                                auto_stories
                            </span>
                            <p className="text-gray-600 mb-6">
                                Clique no botão abaixo para receber um conselho sábio sobre suas finanças
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block">
                                <svg
                                    className="animate-spin h-12 w-12 text-amber-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            </div>
                            <p className="text-amber-700 mt-4 font-medium">José está Analisando...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-600">error</span>
                            <p className="text-sm text-red-900">{error}</p>
                        </div>
                    )}

                    {wisdom && !isLoading && (
                        <div className="relative">
                            {/* Quote marks */}
                            <div className="absolute -top-2 -left-2 text-6xl text-amber-200 font-serif">"</div>
                            <div className="relative z-10 px-4">
                                <p className="text-lg leading-relaxed text-gray-800 font-medium italic text-center">
                                    {wisdom}
                                </p>
                            </div>
                            <div className="absolute -bottom-4 -right-2 text-6xl text-amber-200 font-serif">"</div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleGenerateWisdom}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    {isLoading ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Analisando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">auto_awesome</span>
                            {wisdom ? 'Buscar Nova Sabedoria' : 'Receber Sabedoria'}
                        </>
                    )}
                </button>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Como funciona?</p>
                            <p className="text-blue-800">
                                José analisa seus gastos e investimentos recentes e oferece conselhos práticos baseados em princípios bíblicos de administração financeira, como a sabedoria de guardar nas "vacas gordas" e os ensinamentos de Provérbios sobre prudência.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
