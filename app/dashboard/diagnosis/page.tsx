'use client'

import { useState } from 'react'
import { getFinancialDiagnosis } from '@/app/actions/gemini-diagnosis'

export default function DiagnosisPage() {
    const [analyzing, setAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const generateDiagnosis = async () => {
        setAnalyzing(true)
        setError(null)

        const result = await getFinancialDiagnosis()

        if (result.success) {
            setAnalysis(result.analysis!)
        } else {
            setError(result.error!)
        }

        setAnalyzing(false)
    }

    return (
        <div className="min-h-screen pb-20 sm:pb-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-extrabold text-[var(--color-text-main)]">
                        Diagnóstico Financeiro
                    </h1>
                    <p className="mt-2 text-[var(--color-text-sub)]">
                        Análise completa da sua situação financeira com IA
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Info Card */}
                <div className="bg-gradient-to-br from-[var(--color-mint-green)]/10 to-[var(--color-primary)]/10 rounded-2xl p-6 border border-[var(--color-mint-green)]/20 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-mint-green)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[var(--color-mint-green)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                auto_awesome
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2">
                                Análise Inteligente com José
                            </h3>
                            <p className="text-sm text-[var(--color-text-sub)] leading-relaxed">
                                O José utiliza inteligência artificial para analisar seus dados financeiros e fornecer recomendações personalizadas. Clique no botão abaixo para gerar seu relatório.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                {!analysis && (
                    <div className="text-center">
                        <button
                            onClick={generateDiagnosis}
                            disabled={analyzing}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold text-lg shadow-lg shadow-[var(--color-primary)]/25 hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analisando seus dados...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined !text-[24px]">analytics</span>
                                    Gerar Diagnóstico Completo
                                </>
                            )}
                        </button>
                        <p className="mt-3 text-sm text-[var(--color-text-sub)]">
                            A análise leva cerca de 10 segundos
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 !text-[24px]">error</span>
                            <div>
                                <h4 className="font-semibold text-red-800 mb-1">Erro ao gerar diagnóstico</h4>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Result */}
                {analysis && (
                    <div className="space-y-6">
                        {/* Analysis Card */}
                        <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-card)] border border-gray-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-mint-green)]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[var(--color-mint-green)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        description
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                                        Previsão do José
                                    </h2>
                                    <p className="text-sm text-[var(--color-text-sub)]">
                                        Gerado com IA • {new Date().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {/* Analysis Content */}
                            <div className="prose prose-lg max-w-none">
                                <div className="whitespace-pre-wrap text-[var(--color-text-main)] leading-relaxed">
                                    {analysis}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => {
                                    setAnalysis(null)
                                    setError(null)
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
                            >
                                <span className="material-symbols-outlined !text-[20px]">refresh</span>
                                Nova Análise
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(analysis)
                                    alert('Análise copiada para a área de transferência!')
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-xl font-semibold hover:bg-[var(--color-primary)]/5 active:scale-[0.98] transition-all"
                            >
                                <span className="material-symbols-outlined !text-[20px]">content_copy</span>
                                Copiar Análise
                            </button>
                        </div>
                    </div>
                )}

                {/* Financial Overview Cards (always visible) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Current Balance */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-[var(--color-text-sub)] uppercase">Saldo Atual</h3>
                            <span className="material-symbols-outlined text-[var(--color-primary)] !text-[20px]">account_balance</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-main)]">R$ 5.420,00</p>
                    </div>

                    {/* Monthly Expenses */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-[var(--color-text-sub)] uppercase">Gastos do Mês</h3>
                            <span className="material-symbols-outlined text-[var(--color-tech-warning)] !text-[20px]">payments</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-text-main)]">R$ 3.250,00</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
