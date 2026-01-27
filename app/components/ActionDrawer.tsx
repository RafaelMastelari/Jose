'use client';

import { Trash2, CheckSquare, Calendar } from 'lucide-react';

interface ActionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteSingle: () => void;
    onEnterSelectionMode: () => void;
    onDeleteMonth: () => void;
}

export function ActionDrawer({
    isOpen,
    onClose,
    onDeleteSingle,
    onEnterSelectionMode,
    onDeleteMonth,
}: ActionDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 shadow-2xl animate-slide-up">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Actions */}
                <div className="px-4 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2">
                        Ações
                    </h3>

                    {/* Delete This Transaction */}
                    <button
                        onClick={() => {
                            onClose();
                            onDeleteSingle();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-6 h-6 text-red-600" />
                        <div className="text-left">
                            <div className="font-medium text-red-600">Excluir esta transação</div>
                            <div className="text-sm text-gray-500">Remove apenas este item</div>
                        </div>
                    </button>

                    {/* Enter Selection Mode */}
                    <button
                        onClick={() => {
                            onClose();
                            onEnterSelectionMode();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors mt-2"
                    >
                        <CheckSquare className="w-6 h-6 text-gray-700" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Selecionar para excluir</div>
                            <div className="text-sm text-gray-500">Ative o modo de seleção múltipla</div>
                        </div>
                    </button>

                    {/* Delete Entire Month */}
                    <button
                        onClick={() => {
                            onClose();
                            onDeleteMonth();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors mt-2 border-t border-gray-200"
                    >
                        <Calendar className="w-6 h-6 text-red-700" />
                        <div className="text-left">
                            <div className="font-medium text-red-700">Excluir mês inteiro</div>
                            <div className="text-sm text-red-400">⚠️ Zona de perigo - Requer confirmação</div>
                        </div>
                    </button>

                    {/* Cancel */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium text-gray-700"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </>
    );
}
