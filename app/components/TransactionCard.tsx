'use client';

import { useLongPress } from '@/app/hooks/useLongPress';
import { getCategoryLabel, getCategoryIcon, getCategoryColor } from '@/lib/categories-client';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense' | 'investment' | 'transfer';
    category: string;
    subcategory?: string;
    transaction_date: string;
}

interface TransactionCardProps {
    transaction: Transaction;
    isSelectionMode: boolean;
    isSelected: boolean;
    onTap: () => void;
    onLongPress: () => void;
    onToggleSelect: () => void;
}

const TYPE_LABELS: Record<string, string> = {
    expense: 'Saída',
    income: 'Entrada',
    investment: 'Investimento',
    transfer: 'Transferência',
};

const TYPE_COLORS: Record<string, string> = {
    expense: 'text-red-600',
    income: 'text-green-600',
    investment: 'text-blue-600',
    transfer: 'text-purple-600',
};

export function TransactionCard({
    transaction,
    isSelectionMode,
    isSelected,
    onTap,
    onLongPress,
    onToggleSelect,
}: TransactionCardProps) {
    const longPressHandlers = useLongPress({
        onLongPress,
        onClick: isSelectionMode ? onToggleSelect : onTap,
        delay: 500,
    });

    const formatValue = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Math.abs(amount));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const month = monthNames[date.getMonth()];
        return `${day}/${month}`;
    };

    const getCategoryIconName = (category: string) => {
        return getCategoryIcon(category);
    };

    const categoryColor = getCategoryColor(transaction.category);
    const categoryLabel = getCategoryLabel(transaction.category);
    const iconName = getCategoryIconName(transaction.category);

    return (
        <div
            {...longPressHandlers}
            className={`
        relative p-4 bg-white rounded-lg border border-gray-200 
        active:bg-gray-100 transition-colors cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      `}
            style={{
                userSelect: 'none',
                WebkitTouchCallout: 'none',
            }}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className={isSelectionMode ? 'ml-8' : ''}>
                {/* Line 1: Type and Value */}
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base text-gray-900">
                        {transaction.type === 'investment'
                            ? (transaction.amount < 0 ? 'Aplicação' : 'Resgate')
                            : (TYPE_LABELS[transaction.type] || 'Outro')}
                    </span>
                    <span className={`font-bold text-lg 
                        ${transaction.type === 'investment'
                            ? (transaction.amount < 0 ? 'text-blue-600' : 'text-orange-600')
                            : (TYPE_COLORS[transaction.type] || 'text-gray-600')
                        }`}>
                        {formatValue(transaction.amount)}
                    </span>
                </div>

                {/* Line 2: Description */}
                <div className="mb-1">
                    <span className="text-base text-gray-800">
                        {transaction.description}
                    </span>
                </div>

                {/* Line 3: Category > Subcategory • Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="material-symbols-outlined !text-[16px]" style={{
                        color: transaction.type === 'investment'
                            ? (transaction.amount < 0 ? '#2563EB' : '#EA580C') // blue-600 : orange-600
                            : categoryColor
                    }}>
                        {transaction.type === 'investment'
                            ? (transaction.amount < 0 ? 'trending_up' : 'savings')
                            : iconName}
                    </span>
                    <span>
                        {categoryLabel}
                        {transaction.subcategory && (
                            <>
                                {' > '}
                                {transaction.subcategory}
                            </>
                        )}
                    </span>
                    <span>•</span>
                    <span>{formatDate(transaction.transaction_date)}</span>
                </div>
            </div>
        </div>
    );
}
