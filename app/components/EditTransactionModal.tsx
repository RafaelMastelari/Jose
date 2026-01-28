'use client'

import { useState, useEffect } from 'react'
import { updateTransactionWithLearning } from '@/app/actions/transaction-actions'
import { CATEGORIES, getAllCategories, getSubcategories } from '@/lib/categories'

interface EditTransactionModalProps {
    transaction: {
        id: string
        description: string
        amount: number
        category: string
        subcategory?: string
        type: string
        date: string
    }
    onClose: () => void
    onSuccess: () => void
}

export default function EditTransactionModal({ transaction, onClose, onSuccess }: EditTransactionModalProps) {
    const [category, setCategory] = useState(transaction.category || 'other')
    const [subcategory, setSubcategory] = useState(transaction.subcategory || '')
    const [customSubcategory, setCustomSubcategory] = useState('')
    const [isCustomSubcategory, setIsCustomSubcategory] = useState(false)
    const [updateSimilar, setUpdateSimilar] = useState(true) // Checked by default
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const categories = getAllCategories()
    const subcategories = getSubcategories(category)

    // Force category and subcategory from transaction on mount
    useEffect(() => {
        setCategory(transaction.category || 'other')
        setSubcategory(transaction.subcategory || '')

        // Check if subcategory is custom (not in predefined list)
        if (transaction.subcategory) {
            const predefinedSubs = getSubcategories(transaction.category || 'other')
            if (!predefinedSubs.includes(transaction.subcategory)) {
                setIsCustomSubcategory(true)
                setCustomSubcategory(transaction.subcategory)
                setSubcategory('custom')
            }
        }
    }, [transaction])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // Ensure we capture the custom value if 'custom' is selected OR if we are in custom mode
            let finalSubcategory = subcategory;
            if (subcategory === 'custom' || (isCustomSubcategory && customSubcategory)) {
                finalSubcategory = customSubcategory
            }

            // Normalization
            if (!finalSubcategory || finalSubcategory.trim() === '') {
                finalSubcategory = null as any // Pass null to clear it
            }

            const result = await updateTransactionWithLearning(
                transaction.id,
                {
                    category,
                    subcategory: finalSubcategory
                },
                updateSimilar
            )

            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.error || 'Erro ao atualizar')
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar transação')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-charcoal">Editar Transação</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-charcoal transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{transaction.description}</p>
                    <p className="text-lg font-bold text-charcoal mt-1">
                        R$ {transaction.amount.toFixed(2)}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                            Categoria Principal
                        </label>
                        <select
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value)
                                setSubcategory('') // Reset subcategory
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal transition-all"
                        >
                            {categories.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Selection */}
                    {subcategories.length > 0 && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Subcategoria (Detalhes)
                            </label>
                            <select
                                value={subcategory}
                                onChange={(e) => {
                                    setSubcategory(e.target.value)
                                    setIsCustomSubcategory(e.target.value === 'custom')
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal transition-all"
                            >
                                <option value="">Nenhuma (apenas categoria)</option>
                                {subcategories.map((sub) => (
                                    <option key={sub} value={sub}>
                                        {sub}
                                    </option>
                                ))}
                                <option value="custom">✏️ Outra (Personalizada)</option>
                            </select>

                            {/* Custom Subcategory Input */}
                            {isCustomSubcategory && (
                                <input
                                    type="text"
                                    value={customSubcategory}
                                    onChange={(e) => setCustomSubcategory(e.target.value)}
                                    placeholder="Digite a subcategoria..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal transition-all"
                                    autoFocus
                                />
                            )}
                        </div>
                    )}

                    {/* Checkbox: Apply to Similar */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={updateSimilar}
                                onChange={(e) => setUpdateSimilar(e.target.checked)}
                                className="mt-1 w-4 h-4 text-teal border-gray-300 rounded focus:ring-teal"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">
                                    Aplicar para transações similares
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Todas as transações com o nome "{transaction.description}" serão atualizadas
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-900">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-charcoal hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
