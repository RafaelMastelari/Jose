'use client';

import { useState } from 'react';
import { TransactionCard } from './TransactionCard';
import EditTransactionModal from './EditTransactionModal';
import { ActionDrawer } from './ActionDrawer';
import { SelectionHeader } from './SelectionHeader';
import { deleteTransaction } from '@/app/actions/transaction-actions';

interface Transaction {
    id: string;
    description: string;
    amount: string;
    type: 'income' | 'expense' | 'investment' | 'transfer';
    category: string;
    subcategory?: string;
    transaction_date: string;
    date: string;
}

interface RecentActivityProps {
    transactions: Transaction[];
}

export default function RecentActivity({ transactions }: RecentActivityProps) {
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

    const onRefresh = () => {
        window.location.reload();
    };

    const handleDeleteSingle = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            const result = await deleteTransaction(id);
            if (result.success) {
                onRefresh();
            }
        }
    };

    const handleDeleteSelected = async () => {
        const count = selectedIds.size;
        if (confirm(`Tem certeza que deseja excluir ${count} ${count === 1 ? 'transação' : 'transações'}?`)) {
            const deletePromises = Array.from(selectedIds).map(id => deleteTransaction(id));
            await Promise.all(deletePromises);
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            onRefresh();
        }
    };

    const handleDeleteMonth = async () => {
        if (!activeTransactionId) return;

        const transaction = transactions.find(t => t.id === activeTransactionId);
        if (!transaction) return;

        const date = new Date(transaction.date || transaction.transaction_date);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        if (confirm(`⚠️ ATENÇÃO: Você tem certeza que deseja excluir TODAS as transações de ${monthName}? Esta ação não pode ser desfeita!`)) {
            const month = date.getMonth();
            const year = date.getFullYear();

            const transactionsToDelete = transactions.filter(t => {
                const tDate = new Date(t.date || t.transaction_date);
                return tDate.getMonth() === month && tDate.getFullYear() === year;
            });

            const deletePromises = transactionsToDelete.map(t => deleteTransaction(t.id));
            await Promise.all(deletePromises);
            onRefresh();
        }
    };

    const handleTap = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };

    const handleLongPress = (transactionId: string) => {
        setActiveTransactionId(transactionId);
        setDrawerOpen(true);
    };

    const handleToggleSelect = (transactionId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(transactionId)) {
            newSelected.delete(transactionId);
        } else {
            newSelected.add(transactionId);
        }
        setSelectedIds(newSelected);
    };

    const handleEnterSelectionMode = () => {
        setIsSelectionMode(true);
        if (activeTransactionId) {
            setSelectedIds(new Set([activeTransactionId]));
        }
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    return (
        <>
            {isSelectionMode && (
                <SelectionHeader
                    selectedCount={selectedIds.size}
                    onCancel={handleCancelSelection}
                    onDeleteSelected={handleDeleteSelected}
                />
            )}

            <div className={`space-y-3 ${isSelectionMode ? 'pt-16' : ''}`}>
                {transactions.map((transaction) => (
                    <TransactionCard
                        key={transaction.id}
                        transaction={{
                            ...transaction,
                            amount: parseFloat(transaction.amount),
                            transaction_date: transaction.date || transaction.transaction_date,
                        }}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(transaction.id)}
                        onTap={() => handleTap(transaction)}
                        onLongPress={() => handleLongPress(transaction.id)}
                        onToggleSelect={() => handleToggleSelect(transaction.id)}
                    />
                ))}
            </div>

            {editingTransaction && !isSelectionMode && (
                <EditTransactionModal
                    transaction={{
                        ...editingTransaction,
                        amount: parseFloat(editingTransaction.amount),
                        date: editingTransaction.date || editingTransaction.transaction_date,
                    }}
                    onClose={() => setEditingTransaction(null)}
                    onSuccess={onRefresh}
                />
            )}

            <ActionDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onDeleteSingle={() => {
                    if (activeTransactionId) {
                        handleDeleteSingle(activeTransactionId);
                    }
                }}
                onEnterSelectionMode={handleEnterSelectionMode}
                onDeleteMonth={handleDeleteMonth}
            />
        </>
    );
}
