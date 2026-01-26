'use client'

import { useState } from 'react'
import { generateWisdom } from '@/app/actions/generate-wisdom'
import Image from 'next/image'

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

// Get Unsplash image URL based on category
function getCategoryImage(category: string): string {
    const imageMap: Record<string, string> = {
        'saving': 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=400&h=400&fit=crop', // Coffee cup - lazer
        'emergency': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop', // Wheat field - reserva
        'investment': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop', // Plant growth - investimento
    }
    return imageMap[category] || imageMap['emergency']
}

// Get category icon
function getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
        'saving': 'savings',
        'emergency': 'grain',
        'investment': 'trending_up',
    }
    return iconMap[category] || 'lightbulb'
}

// Get category color
function getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
        'saving': 'teal',
        'emergency': 'amber',
        'investment': 'green',
    }
    return colorMap[category] || 'blue'
}

export default function TipsPage() {
    const [wisdom, setWisdom] = useState<StructuredWisdom | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGenerateWisdom = async () => {
        setError('')
        setIsLoading(true)

        try {
            const result = await generateWisdom()

            if (result.success && result.wisdom) {
                setWisdom(result.wisdom)
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
        <div className="min-h-screen bg-[#F0F4F8] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Sabedoria de José</h1>
            </div>

            <div className="p-6 max-w-2xl mx-auto space-y-6">
                {/* Initial State or Loading */}
                {!wisdom && !error && (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        {isLoading ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-primary)] border-t-transparent mb-4"></div>
                                <p className="text-[var(--color-text-main)] font-semibold">José está analisando suas finanças...</p>
                                <p className="text-[var(--color-text-sub)] text-sm mt-2">Preparando conselhos sábios</p>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[80px] text-[var(--color-primary)]/20 mb-4 block">
                                    history_edu
                                </span>
                                <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                                    Receba Conselhos Sábios
                                </h3>
                                <p className="text-[var(--color-text-sub)] mb-6">
                                    José analisará suas finanças e oferecerá orientações práticas baseadas em sabedoria bíblica
                                </p>
                                <button
                                    onClick={handleGenerateWisdom}
                                    className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors inline-flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Gerar Sabedoria
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-600 !text-[24px]">error</span>
                        <div>
                            <p className="font-semibold text-red-900 mb-1">Erro ao Gerar Sabedoria</p>
                            <p className="text-sm text-red-800">{error}</p>
                            <button
                                onClick={handleGenerateWisdom}
                                className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                )}

                {/* Wisdom Content */}
                {wisdom && !isLoading && (
                    <>
                        {/* Verse Citation Block */}
                        <div className="bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-mint-green)]/10 rounded-2xl p-8 border-2 border-[var(--color-primary)]/10">
                            <div className="flex justify-center mb-4">
                                <span className="material-symbols-outlined text-[var(--color-primary)] !text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    format_quote
                                </span>
                            </div>
                            <p className="text-[var(--color-text-main)] text-lg italic text-center leading-relaxed mb-4">
                                "{wisdom.verse.text}"
                            </p>
                            <p className="text-[var(--color-primary)] font-bold text-center uppercase tracking-wide text-sm">
                                {wisdom.verse.reference}
                            </p>
                        </div>

                        {/* Tips Cards */}
                        <div className="space-y-4">
                            {wisdom.tips.map((tip, index) => {
                                const color = getCategoryColor(tip.category)
                                const icon = getCategoryIcon(tip.category)
                                const imageUrl = getCategoryImage(tip.category)

                                return (
                                    <div
                                        key={index}
                                        className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Left: Icon + Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                                                        <span className={`material-symbols-outlined text-${color}-500 !text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                            {icon}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-[var(--color-text-main)] font-bold text-lg">
                                                        {tip.title}
                                                    </h3>
                                                </div>
                                                <p className="text-[var(--color-text-sub)] leading-relaxed mb-3">
                                                    {tip.content}
                                                </p>
                                                <button className={`text-${color}-600 font-semibold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all`}>
                                                    Ver detalhe
                                                    <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                                                </button>
                                            </div>

                                            {/* Right: Image */}
                                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={imageUrl}
                                                    alt={tip.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* WhatsApp CTA Card */}
                        <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200/50 overflow-hidden">
                            {/* "EM BREVE" Badge */}
                            <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                                Em Breve
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[var(--color-text-main)] font-bold text-lg mb-1">
                                        Mais Dicas via WhatsApp
                                    </h3>
                                    <p className="text-[var(--color-text-sub)] text-sm">
                                        Receba conselhos personalizados diretamente no seu celular
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Generate New Button */}
                        <button
                            onClick={handleGenerateWisdom}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Gerar Nova Sabedoria
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
