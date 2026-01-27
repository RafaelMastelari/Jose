'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTransactions, deleteTransaction, updateTransactionWithLearning } from '@/app/actions/transaction-actions'
import { TransactionCard } from '@/app/components/TransactionCard'
import EditTransactionModal from '@/app/components/EditTransactionModal'
import { ActionDrawer } from '@/app/components/ActionDrawer'
import { SelectionHeader } from '@/app/components/SelectionHeader'

interface Transaction {
    id: string
    user_id: string
    date: string
    description: string
    amount: number
    type: 'income' | 'expense' | 'investment' | 'transfer'
    category: string
    created_at: string
    updated_at: string
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    // Edit and selection state
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null)

    const [error, setError] = useState('')

    // Load transactions
    useEffect(() => {
        loadTransactions()
    }, [currentMonth, currentYear])

    const loadTransactions = async () => {
        setLoading(true)
        setError('')

        const result = await getTransactions(currentMonth, currentYear)

        if (result.success) {
            setTransactions(result.data || [])
        } else {
            setError(result.error || 'Erro ao carregar transações')
        }

        setLoading(false)
    }

    // Month navigation
    const goToPreviousMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const getMonthName = (month: number) => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        return months[month - 1]
    }

    // Transaction handlers
    const handleEdit = async (id: string, data: any) => {
        const result = await updateTransactionWithLearning(id, data)
        if (result.success) {
            setEditingTransaction(null)
            loadTransactions()
        }
    }

    const handleDeleteSingle = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            const result = await deleteTransaction(id)
            if (result.success) {
                loadTransactions()
            }
        }
    }

    const handleDeleteSelected = async () => {
        const count = selectedIds.size
        if (confirm(`Tem certeza que deseja excluir ${count} ${count === 1 ? 'transação' : 'transações'}?`)) {
            const deletePromises = Array.from(selectedIds).map(id => deleteTransaction(id))
            await Promise.all(deletePromises)
            setSelectedIds(new Set())
            setIsSelectionMode(false)
            loadTransactions()
        }
    }

    const handleDeleteMonth = async () => {
        if (!activeTransactionId) return

        const transaction = transactions.find(t => t.id === activeTransactionId)
        if (!transaction) return

        const date = new Date(transaction.date)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        if (confirm(`⚠️ ATENÇÃO: Você tem certeza que deseja excluir TODAS as transações de ${monthName}? Esta ação não pode ser desfeita!`)) {
            const month = date.getMonth()
            const year = date.getFullYear()

            const transactionsToDelete = transactions.filter(t => {
                const tDate = new Date(t.date)
                return tDate.getMonth() === month && tDate.getFullYear() === year
            })

            const deletePromises = transactionsToDelete.map(t => deleteTransaction(t.id))
            await Promise.all(deletePromises)
            loadTransactions()
        }
    }

    const handleTap = (transaction: Transaction) => {
        setEditingTransaction(transaction)
    }

    const handleLongPress = (transactionId: string) => {
        setActiveTransactionId(transactionId)
        setDrawerOpen(true)
    }

    const handleToggleSelect = (transactionId: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(transactionId)) {
            newSelected.delete(transactionId)
        } else {
            newSelected.add(transactionId)
        }
        setSelectedIds(newSelected)
    }

    const handleEnterSelectionMode = () => {
        setIsSelectionMode(true)
        if (activeTransactionId) {
            setSelectedIds(new Set([activeTransactionId]))
        }
    }

    const handleCancelSelection = () => {
        setIsSelectionMode(false)
        setSelectedIds(new Set())
    }

    // Group transactions by day
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {} as Record<string, Transaction[]>)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', weekday: 'short' })
    }

    return (
        <div className="min-h-screen pb-20 bg-[var(--color-background-ice)]">
            {/* Header with Month Selector */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-4">Histórico</h1>

                    {/* Month/Year Navigator */}
                    <div className="flex items-center justify-between bg-[var(--color-background-ice)] rounded-lg p-3">
                        <button
                            onClick={goToPreviousMonth}
                            className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[var(--color-primary)]">chevron_left</span>
                        </button>

                        <div className="text-center">
                            <p className="text-lg font-bold text-[var(--color-text-main)]">
                                {getMonthName(currentMonth)}
                            </p>
                            <p className="text-sm text-[var(--color-text-sub)]">
                                {currentYear}
                            </p>
                        </div>

                        <button
                            onClick={goToNextMonth}
                            className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[var(--color-primary)]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-6">
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
                        <p className="text-[var(--color-text-sub)] mt-4">Carregando...</p>
                    </div>
                )}

                {!loading && transactions.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4 block">
                            receipt_long
                        </span>
                        <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                            Nenhuma transação
                        </h3>
                        <p className="text-[var(--color-text-sub)] mb-6">
                            Não há transações registradas para {getMonthName(currentMonth)} de {currentYear}
                        </p>
                        <Link
                            href="/dashboard/import"
                            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <span className="material-symbols-outlined">upload_file</span>
                            Importar Extrato
                        </Link>
                    </div>
                )}

                {isSelectionMode && (
                    <SelectionHeader
                        selectedCount={selectedIds.size}
                        onCancel={handleCancelSelection}
                        onDeleteSelected={handleDeleteSelected}
                    />
                )}

                {!loading && Object.keys(groupedTransactions).length > 0 && (
                    <div className={`space-y-6 ${isSelectionMode ? 'pt-16' : ''}`}>
                        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="bg-[var(--color-background-ice)] px-4 py-2 rounded-t-lg">
                                    <p className="text-sm font-semibold text-[var(--color-text-sub)] capitalize">
                                        {formatDate(date)}
                                    </p>
                                </div>

                                {/* Transactions List */}
                                <div className="space-y-3 mt-2">
                                    {dayTransactions.map((transaction) => (
                                        <TransactionCard
                                            key={transaction.id}
                                            transaction={{
                                                ...transaction,
                                                transaction_date: transaction.date,
                                            }}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedIds.has(transaction.id)}
                                            onTap={() => handleTap(transaction)}
                                            onLongPress={() => handleLongPress(transaction.id)}
                                            onToggleSelect={() => handleToggleSelect(transaction.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTransaction && !isSelectionMode && (
                <EditTransactionModal
                    transaction={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                    onSuccess={loadTransactions}
                />
            )}

            {/* Action Drawer */}
            <ActionDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onDeleteSingle={() => {
                    if (activeTransactionId) {
                        handleDeleteSingle(activeTransactionId)
                    }
                }}
                onEnterSelectionMode={handleEnterSelectionMode}
                onDeleteMonth={handleDeleteMonth}
            />
        </div>
    )
}
