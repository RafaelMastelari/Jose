'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BalanceAdjustmentModal } from './BalanceAdjustmentModal'

interface BalanceAdjusterProps {
    currentBalance: number
}

export function BalanceAdjuster({ currentBalance }: BalanceAdjusterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleSuccess = () => {
        router.refresh() // Refresh server components
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(true)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-[var(--color-primary)] transition-colors active:scale-90"
                title="Ajuste Mágico de Saldo"
            >
                <span className="material-symbols-outlined !text-[18px]">edit</span>
            </button>

            {isOpen && (
                <BalanceAdjustmentModal
                    currentBalance={currentBalance}
                    onClose={() => setIsOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    )
}
