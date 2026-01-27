'use client'

import { useState, useEffect } from 'react'
import { createBalanceAdjustment } from '@/app/actions/transaction-actions'

interface BalanceAdjustmentModalProps {
    currentBalance: number
    onClose: () => void
    onSuccess: () => void
}

export function BalanceAdjustmentModal({
    currentBalance,
    onClose,
    onSuccess
}: BalanceAdjustmentModalProps) {
    const [realBalanceStr, setRealBalanceStr] = useState('')
    const [difference, setDifference] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Auto-calculate difference
    useEffect(() => {
        if (!realBalanceStr) {
            setDifference(null)
            return
        }

        const cleanVal = parseFloat(realBalanceStr.replace(/\./g, '').replace(',', '.'))
        if (!isNaN(cleanVal)) {
            setDifference(cleanVal - currentBalance)
        } else {
            setDifference(null)
        }
    }, [realBalanceStr, currentBalance])

    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value

        // Basic masking similar to other inputs, assuming simple user input for now
        // Remove non-digits
        const digits = value.replace(/\D/g, '')

        if (digits) {
            const number = parseFloat(digits) / 100
            value = number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            setRealBalanceStr(value)
        } else {
            setRealBalanceStr('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (difference === null || isNaN(difference)) return

        setIsLoading(true)
        setError('')

        // Create adjustment
        const result = await createBalanceAdjustment(difference)

        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || 'Erro ao criar ajuste')
        }
        setIsLoading(false)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Ajuste Mágico ✨</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                        Diga quanto você realmente tem no banco, e o José criará uma transação automática para corrigir o saldo.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Saldo no App (Calculado)
                            </label>
                            <div className="text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                {formatCurrency(currentBalance)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-primary)] uppercase mb-1">
                                Quanto você tem no banco?
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                <input
                                    type="text"
                                    value={realBalanceStr}
                                    onChange={handleMoneyChange}
                                    placeholder="0,00"
                                    className="w-full pl-10 pr-4 py-3 text-lg font-bold text-gray-900 border-2 border-[var(--color-primary)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {difference !== null && Math.abs(difference) > 0.01 && (
                            <div className={`p-4 rounded-xl border ${difference > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    O José vai criar:
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${difference > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <span className="material-symbols-outlined">
                                            {difference > 0 ? 'trending_up' : 'trending_down'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${difference > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {formatCurrency(Math.abs(difference))}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {difference > 0 ? 'Receita de Ajuste' : 'Despesa de Ajuste'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || difference === null || Math.abs(difference) < 0.01}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] transition-all"
                        >
                            {isLoading ? 'Ajustando...' : 'Confirmar Ajuste'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
