'use client';

import { X, Trash2 } from 'lucide-react';

interface SelectionHeaderProps {
    selectedCount: number;
    onCancel: () => void;
    onDeleteSelected: () => void;
}

export function SelectionHeader({
    selectedCount,
    onCancel,
    onDeleteSelected,
}: SelectionHeaderProps) {
    return (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white z-30 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-lg">
                        {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
                    </span>
                </div>

                <button
                    onClick={onDeleteSelected}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Excluir</span>
                </button>
            </div>
        </div>
    );
}
