import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import RecentActivity from '../components/RecentActivity'
import { BalanceAdjuster } from '../components/BalanceAdjuster'
import { InvestmentAdjuster } from '../components/InvestmentAdjuster'

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

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userName = user?.user_metadata?.full_name || 'Usuário'
    const firstName = userName.split(' ')[0]

    // Get current month start and end dates
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthStartStr = monthStart.toISOString().split('T')[0]
    const monthEndStr = monthEnd.toISOString().split('T')[0]

    // Fetch transactions from Supabase
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', monthStartStr)
        .lte('date', monthEndStr)
        .order('date', { ascending: false })

    // Calculate financial metrics with ADVANCED ACCOUNTING LOGIC (Using signed values now)
    // Income = Sum of positive incomings
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) || 0
    // Expenses = Sum of negative outgoings (absolute for display)
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) || 0

    // NET INVESTMENT: Now summing signed values directly!
    // Application (Negative) + Redemption (Positive)
    const investmentTransactions = transactions?.filter(t => t.type === 'investment') || []

    // Applications: Sum of negative values (displayed as positive in breakdown)
    const totalApplications = investmentTransactions
        .filter(t => parseFloat(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) || 0

    // Redemptions: Sum of positive values
    const totalRedemptions = investmentTransactions
        .filter(t => parseFloat(t.amount) > 0)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

    // Net Investment = Redemptions - Applications (or Sum of all if using signs)
    // Since Applications are negative in DB, just summing them works for "Asset Growth" logic if we consider applications as "assets gained"?
    // User wants: (Resgates) - (Aplicações). Wait, standard accounting:
    // Net Flow = Inflow - Outflow.
    // If Result is Negative -> Net Invested (Good). If Positive -> Net Redeemed (Divestment).
    // BUT User card is "Vacas Gordas" (Fat Cows). Usually implies "Total Accumulated" or "Net Value".
    // Let's stick to standard flow: Net Investment = Total Apps (Abs) - Total Redemptions.
    // OR User asked: "netInvestment seja: (Resgates) - (Aplicações Absolutas) OU soma aritmética"
    // If I sum arithmetic: -100 (App) + 20 (Red) = -80. 
    // If I show -80, it means 80 invested.
    // Let's use the arithmetic sum for calculation but display strictly positive for the breakdown.

    // Net Investment = Total Apps (Abs) - Total Redemptions.
    // Invert the sum so that (Negative Apps) become Positive Savings
    const netInvestment = -1 * investmentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)

    // For "Current Balance", we simply sum EVERYTHING (Income - Expense + Investment Flow)
    // currentBalance = Income Abs - Expense Abs + Investment Flow
    // BUT typically investment outflow reduces "Checking Balance".
    // So yes, just sum everything if signs are correct (Income +, Expense -, Invest -, Redeem +)

    // Re-calculating balance based on SIGNED sum of everything?
    // transactions already have correct signs (Expense -, Income +, Invest -, Redeem +)
    // So currentBalance = Sum of ALL transactions amounts

    const currentBalance = transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
    const monthlySpending = totalExpenses

    // Get recent transactions from ALL TIME (not just current month) for Activity widget
    const { data: allTimeRecent } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(5)

    const recentTransactions = allTimeRecent || []

    // Check if user has any data
    const hasData = recentTransactions.length > 0

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffTime = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoje'
        if (diffDays === 1) return 'Ontem'
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    return (
        <div className="min-h-screen pb-20 sm:pb-8">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-30"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                            Olá, {firstName}! 👋
                        </h1>
                        <p className="text-lg text-white/90">
                            {hasData ? 'Veja como está sua saúde financeira' : 'Comece importando seus dados financeiros'}
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 48H1440V24C1440 24 1200 0 720 0C240 0 0 24 0 24V48Z" fill="var(--color-background-ice)" />
                    </svg>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                {/* No Data State */}
                {!hasData && (
                    <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-card)] border border-gray-100 mb-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[var(--color-primary)] !text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                upload_file
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                            Nenhuma transação encontrada
                        </h3>
                        <p className="text-[var(--color-text-sub)] mb-6">
                            Importe seu primeiro extrato para o José começar a analisar suas finanças!
                        </p>
                        <Link
                            href="/dashboard/import"
                            className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-3 px-6 rounded-lg transition-all"
                        >
                            <span className="material-symbols-outlined !text-[20px]">upload_file</span>
                            Importar Primeiro Extrato
                        </Link>
                    </div>
                )}

                {/* Financial Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Saldo Atual */}
                    <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">
                                    Saldo Atual
                                </h3>
                                <BalanceAdjuster currentBalance={currentBalance} />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[var(--color-primary)] !text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    account_balance_wallet
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-[var(--color-text-main)]">
                                {formatCurrency(currentBalance)}
                            </p>
                            <p className="text-sm text-[var(--color-text-sub)]">
                                Receitas - Despesas
                            </p>
                        </div>
                    </div>

                    {/* Gastos do Mês */}
                    <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">
                                Gastos do Mês
                            </h3>
                            <div className="w-10 h-10 rounded-full bg-[var(--color-tech-warning)]/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[var(--color-tech-warning)] !text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    payments
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-[var(--color-text-main)]">
                                {formatCurrency(monthlySpending)}
                            </p>
                            <p className="text-sm text-[var(--color-text-sub)]">
                                {hasData ? `${transactions?.filter(t => t.type === 'expense').length} transações` : 'Sem dados'}
                            </p>
                        </div>
                    </div>

                    {/* Investment (Vacas Gordas) */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-[var(--shadow-card)] text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>grain</span>
                                Vacas Gordas
                            </h3>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-3xl font-bold text-white">
                                {formatCurrency(netInvestment)}
                            </p>
                            <p className="text-sm text-white/80">
                                {hasData ? 'Investimento Líquido' : 'Comece a investir!'}
                            </p>
                            {hasData && (
                                <div className="flex gap-3 text-xs text-white/70 mt-2 pt-2 border-t border-white/20">
                                    <div>
                                        <span>Aplicado:</span>
                                        <span className="font-semibold ml-1">{formatCurrency(totalApplications)}</span>
                                    </div>
                                    <div>
                                        <span>Resgatado:</span>
                                        <span className="font-semibold ml-1">{formatCurrency(totalRedemptions)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-4">
                        Ações Rápidas
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            href="/dashboard/diagnosis"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-background-ice)] hover:bg-[var(--color-primary)]/5 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[var(--color-primary)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    analytics
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text-main)] text-center">
                                Diagnóstico
                            </span>
                        </Link>

                        <Link
                            href="/dashboard/import"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-background-ice)] hover:bg-[var(--color-primary)]/5 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[var(--color-primary)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    upload_file
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text-main)] text-center">
                                Importar Dados
                            </span>
                        </Link>

                        <Link
                            href="/dashboard/tips"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-background-ice)] hover:bg-[var(--color-primary)]/5 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-[var(--color-mint-green)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[var(--color-mint-green)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    history_edu
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text-main)] text-center">
                                Sabedoria
                            </span>
                        </Link>

                        <Link
                            href="/dashboard/settings"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-background-ice)] hover:bg-[var(--color-primary)]/5 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[var(--color-primary)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    settings
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text-main)] text-center">
                                Configurações
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                {hasData && (
                    <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[var(--color-text-main)]">
                                Atividade Recente
                            </h2>
                            <Link
                                href="/dashboard/transactions"
                                className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                            >
                                Ver todas
                            </Link>
                        </div>
                        <RecentActivity transactions={recentTransactions} />
                    </div>
                )}
            </div>
        </div>
    )
}
