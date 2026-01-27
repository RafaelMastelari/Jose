'use client';

import { Transaction } from '@/app/actions/transaction-actions'; // Ensure this type is exported or redefine it
import { useState, useEffect } from 'react';

// Define Transaction interface locally if not efficiently exported, 
// or import it if available. Based on previous files, it's defined in multiple places.
// Best to define it here or import. Let's define a subset needed.
export interface ChartTransaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    subcategory?: string | null;
}

interface ChartDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: ChartTransaction[];
    color: string;
}

export function ChartDetailsDrawer({
    isOpen,
    onClose,
    title,
    transactions,
    color
}: ChartDetailsDrawerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            // Delay hiding for animation
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                style={{ maxHeight: '80vh' }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-10 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {transactions.length} transações
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(80vh - 100px)' }}>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {t.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{formatDate(t.date)}</span>
                                        {t.subcategory && (
                                            <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">
                                                {t.subcategory}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 whitespace-nowrap">
                                    {formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
