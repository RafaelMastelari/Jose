'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface MonthSelectorProps {
    currentMonth: number // 1-12
    currentYear: number
}

export default function MonthSelector({ currentMonth, currentYear }: MonthSelectorProps) {
    const router = useRouter()

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const goToPreviousMonth = () => {
        let newMonth = currentMonth - 1
        let newYear = currentYear

        if (newMonth < 1) {
            newMonth = 12
            newYear = currentYear - 1
        }

        console.log('Going to previous month:', newMonth, newYear)
        router.push(`/dashboard/diagnosis?month=${newMonth}&year=${newYear}`)
    }

    const goToNextMonth = () => {
        let newMonth = currentMonth + 1
        let newYear = currentYear

        if (newMonth > 12) {
            newMonth = 1
            newYear = currentYear + 1
        }

        // Don't go beyond current month
        const today = new Date()
        const targetDate = new Date(newYear, newMonth - 1)
        const currentDate = new Date(today.getFullYear(), today.getMonth())

        if (targetDate > currentDate) {
            console.log('Cannot go to future month')
            return // Can't go to future months
        }

        console.log('Going to next month:', newMonth, newYear)
        router.push(`/dashboard/diagnosis?month=${newMonth}&year=${newYear}`)
    }

    const goToCurrentMonth = () => {
        router.push('/dashboard/diagnosis')
    }

    const isCurrentMonth = () => {
        const today = new Date()
        return currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
    }

    const canGoNext = () => {
        const today = new Date()
        let newMonth = currentMonth + 1
        let newYear = currentYear

        if (newMonth > 12) {
            newMonth = 1
            newYear = currentYear + 1
        }

        const targetDate = new Date(newYear, newMonth - 1)
        const currentDate = new Date(today.getFullYear(), today.getMonth())

        return targetDate <= currentDate
    }

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
            <button
                onClick={goToPreviousMonth}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Mês anterior"
            >
                <span className="material-symbols-outlined text-[var(--color-text-main)]">chevron_left</span>
            </button>

            <div className="flex-1 text-center">
                <p className="text-lg font-bold text-[var(--color-text-main)]">
                    {months[currentMonth - 1]} {currentYear}
                </p>
                {!isCurrentMonth() && (
                    <button
                        onClick={goToCurrentMonth}
                        className="text-xs text-[var(--color-primary)] font-semibold mt-1 hover:underline"
                    >
                        Voltar para hoje
                    </button>
                )}
            </div>

            <button
                onClick={goToNextMonth}
                disabled={!canGoNext()}
                className="w-10 h-10 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                aria-label="Próximo mês"
            >
                <span className="material-symbols-outlined text-[var(--color-text-main)]">chevron_right</span>
            </button>
        </div>
    )
}
