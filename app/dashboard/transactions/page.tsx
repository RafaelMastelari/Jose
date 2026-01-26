'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTransactions, updateTransaction, deleteTransaction } from '@/app/actions/transaction-actions'

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

// Helper to get category icon
function getCategoryIcon(category: string, type: string) {
    if (type === 'income') return 'trending_up'
    if (type === 'investment') return 'grain'
    if (type === 'transfer') return 'sync_alt'

    const categoryMap: Record<string, string> = {
        'Alimentação': 'restaurant',
        'Transporte': 'directions_car',
        'Lazer': 'movie',
        'Moradia': 'home',
        'Saúde': 'medical_services',
        'Educação': 'school',
        'Salário': 'payments',
        'Freelance': 'work',
    }
    return categoryMap[category] || 'shopping_cart'
}

// Helper to get category color
function getCategoryColor(type: string) {
    const colorMap: Record<string, string> = {
        'income': 'green',
        'expense': 'red',
        'investment': 'blue',
        'transfer': 'amber',
    }
    return colorMap[type] || 'gray'
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [editForm, setEditForm] = useState({
        date: '',
        description: '',
        amount: '',
        type: 'expense' as 'income' | 'expense' | 'investment' | 'transfer',
        category: '',
    })

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [actionLoading, setActionLoading] = useState(false)
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

    // Edit handlers
    const openEditModal = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setEditForm({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount.toString(),
            type: transaction.type,
            category: transaction.category,
        })
        setEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingTransaction) return

        setActionLoading(true)
        setError('')

        const result = await updateTransaction(editingTransaction.id, {
            date: editForm.date,
            description: editForm.description,
            amount: parseFloat(editForm.amount),
            type: editForm.type,
            category: editForm.category,
        })

        if (result.success) {
            setEditModalOpen(false)
            loadTransactions()
        } else {
            setError(result.error || 'Erro ao atualizar')
        }

        setActionLoading(false)
    }

    // Delete handlers
    const openDeleteModal = (id: string) => {
        setDeletingId(id)
        setDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletingId) return

        setActionLoading(true)
        setError('')

        const result = await deleteTransaction(deletingId)

        if (result.success) {
            setDeleteModalOpen(false)
            setDeletingId(null)
            loadTransactions()
        } else {
            setError(result.error || 'Erro ao excluir')
        }

        setActionLoading(false)
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

                {!loading && Object.keys(groupedTransactions).length > 0 && (
                    <div className="space-y-6">
                        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                            <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Date Header */}
                                <div className="bg-[var(--color-background-ice)] px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-[var(--color-text-sub)] capitalize">
                                        {formatDate(date)}
                                    </p>
                                </div>

                                {/* Transactions List */}
                                <div className="divide-y divide-gray-100">
                                    {dayTransactions.map((transaction) => {
                                        const color = getCategoryColor(transaction.type)
                                        const icon = getCategoryIcon(transaction.category, transaction.type)
                                        const isPositive = transaction.type === 'income'

                                        return (
                                            <div key={transaction.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                                <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                                                    <span className={`material-symbols-outlined text-${color}-500 !text-[20px]`}>
                                                        {icon}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">
                                                        {transaction.description}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-sub)]">
                                                        {transaction.category}
                                                    </p>
                                                </div>

                                                <p className={`text-sm font-bold text-${color}-500 flex-shrink-0`}>
                                                    {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </p>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => openEditModal(transaction)}
                                                        className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-blue-500 !text-[18px]">
                                                            edit
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={() => openDeleteModal(transaction.id)}
                                                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-red-500 !text-[18px]">
                                                            delete
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editModalOpen && editingTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[var(--color-text-main)]">Editar Transação</h3>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Valor (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Categoria
                                </label>
                                <input
                                    type="text"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-900">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-[var(--color-text-main)] hover:bg-gray-50 transition-colors"
                                    disabled={actionLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setDeleteModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-red-500 !text-[32px]">
                                    delete
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                                Excluir Transação?
                            </h3>
                            <p className="text-[var(--color-text-sub)]">
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-900">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-[var(--color-text-main)] hover:bg-gray-50 transition-colors"
                                disabled={actionLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
