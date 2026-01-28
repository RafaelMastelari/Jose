'use client'

import { useState } from 'react'
import { createInvestmentAdjustment } from '@/app/actions/transaction-actions'

interface InvestmentAdjusterProps {
    currentBalance: number
}

export function InvestmentAdjuster({ currentBalance }: InvestmentAdjusterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [realBalance, setRealBalance] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // Parse input (handling br format)
            const parsedRealBalance = parseFloat(
                realBalance.replace(/\./g, '').replace(',', '.')
            )

            if (isNaN(parsedRealBalance)) {
                throw new Error('Valor inválido')
            }

            const difference = parsedRealBalance - currentBalance

            if (Math.abs(difference) < 0.01) {
                setIsOpen(false)
                return
            }

            const result = await createInvestmentAdjustment(difference)

            if (result.success) {
                setIsOpen(false)
                setRealBalance('')
            } else {
                setError(result.error || 'Erro ao ajustar')
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar ajuste')
        } finally {
            setIsLoading(false)
        }
    }

    // Format currency for display
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Ajustar Saldo Investido"
            >
                <span className="material-symbols-outlined !text-[16px]">edit</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-gray-900">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Ajuste Manual de Investimento
                </h3>

                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                    <p className="text-sm text-blue-700 mb-1">O App calculou:</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(currentBalance)}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quanto você tem aplicado hoje?
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                R$
                            </span>
                            <input
                                type="text"
                                value={realBalance}
                                onChange={(e) => {
                                    // Basic mask for existing input behavior or simple text
                                    setRealBalance(e.target.value)
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-semibold"
                                placeholder="0,00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !realBalance}
                            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
