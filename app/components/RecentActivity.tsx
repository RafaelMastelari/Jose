'use client'

import { useState } from 'react'
import EditTransactionModal from './EditTransactionModal'
import { getCategoryIcon, getCategoryColor } from '@/lib/categories'

interface Transaction {
    id: string
    description: string
    amount: string // From database it comes as string
    category: string
    subcategory?: string
    type: string
    date: string
}

interface RecentActivityProps {
    transactions: Transaction[]
}

export default function RecentActivity({ transactions }: RecentActivityProps) {
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffTime = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoje'
        if (diffDays === 1) return 'Ontem'
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const handleSuccess = () => {
        setIsRefreshing(true)
        // Refresh the page to show updated data
        window.location.reload()
    }

    return (
        <>
            <div className="space-y-3">
                {transactions.map((transaction) => {
                    const color = getCategoryColor(transaction.category)
                    const icon = getCategoryIcon(transaction.category)
                    const isPositive = transaction.type === 'income'
                    const amount = parseFloat(transaction.amount)
                    const displayLabel = transaction.subcategory || transaction.category

                    return (
                        <button
                            key={transaction.id}
                            onClick={() => setEditingTransaction(transaction)}
                            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                                <span className={`material-symbols-outlined text-${color}-500 !text-[20px]`}>
                                    {icon}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-charcoal truncate">
                                    {transaction.description}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {formatDate(transaction.date)} • {displayLabel}
                                </p>
                            </div>
                            <p className={`text-sm font-bold text-${color}-500 flex-shrink-0`}>
                                {isPositive ? '+' : '-'}{formatCurrency(amount)}
                            </p>
                        </button>
                    )
                })}
            </div>

            {editingTransaction && (
                <EditTransactionModal
                    transaction={{
                        ...editingTransaction,
                        amount: parseFloat(editingTransaction.amount)
                    }}
                    onClose={() => setEditingTransaction(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    )
}
