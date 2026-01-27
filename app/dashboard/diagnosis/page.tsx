import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import MonthSelector from '@/app/components/MonthSelector'
import { InteractivePieChart } from '@/app/components/InteractivePieChart'
import { getCategoryLabel } from '@/lib/categories'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Portuguese category mapping
const CATEGORY_LABEL_MAP: Record<string, string> = {
    'food': 'Alimentação',
    'transport': 'Transporte',
    'housing': 'Moradia',
    'health': 'Saúde',
    'shopping': 'Compras',
    'finance': 'Finanças',
    'leisure': 'Lazer',
    'education': 'Educação',
    'income': 'Receitas',
    'investment': 'Investimento',
    'transfer': 'Transferência',
    'other': 'Outros',
}

function translateCategory(category: string): string {
    const lowerCategory = category.toLowerCase()
    return CATEGORY_LABEL_MAP[lowerCategory] || category
}

// Category color mapping for charts
const categoryColors: Record<string, string> = {
    'Alimentação': '#F97316', // Orange
    'Transporte': '#06B6D4', // Cyan
    'Moradia': '#8B5CF6', // Violet
    'Saúde': '#10B981', // Emerald
    'Lazer': '#EAB308', // Yellow
    'Educação': '#3B82F6', // Blue
    'Compras': '#EC4899', // Pink
    'Investimento': '#8B5CF6', // Violet
    'Outros': '#94A3B8', // Slate
    'Transferência': '#64748B', // Slate
    'Finanças': '#64748B', // Slate
}

function getCategoryColor(category: string): string {
    return categoryColors[category] || categoryColors['Outros']
}

interface PageProps {
    searchParams: Promise<{ month?: string; year?: string }>
}

export default async function DiagnosisPage(props: PageProps) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Parse month/year from searchParams or use current date
    const now = new Date()
    const selectedMonth = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1
    const selectedYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()

    // Calculate month start and end based on selected month
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
    const monthEnd = new Date(selectedYear, selectedMonth, 0)

    const monthStartStr = monthStart.toISOString().split('T')[0]
    const monthEndStr = monthEnd.toISOString().split('T')[0]

    // Fetch all expenses for selected month
    const { data: expenses } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'expense')
        .gte('date', monthStartStr)
        .lte('date', monthEndStr)

    // Data structures for hierarchical chart
    type ChartItem = {
        name: string
        value: number
        fill?: string
        percentage: number // Changed to number
        subcategories?: ChartItem[]
        transactions?: any[]
    }

    const totalGastos = expenses?.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) || 0

    const hierarchicalData: Record<string, {
        total: number
        subcategories: Record<string, { total: number, transactions: any[] }>
        transactions: any[]
    }> = {}

    // Process transactions
    expenses?.forEach(expense => {
        const cat = translateCategory(expense.category || 'Outros')
        const subcat = expense.subcategory || 'Sem detalhe'

        if (!hierarchicalData[cat]) {
            hierarchicalData[cat] = {
                total: 0,
                subcategories: {},
                transactions: []
            }
        }

        // Add to category total
        const amount = Math.abs(parseFloat(expense.amount))
        hierarchicalData[cat].total += amount
        hierarchicalData[cat].transactions.push(expense)

        // Add to subcategory
        if (!hierarchicalData[cat].subcategories[subcat]) {
            hierarchicalData[cat].subcategories[subcat] = {
                total: 0,
                transactions: []
            }
        }
        hierarchicalData[cat].subcategories[subcat].total += amount
        hierarchicalData[cat].subcategories[subcat].transactions.push(expense)
    })

    // Convert to array format for Recharts
    const chartData: ChartItem[] = Object.entries(hierarchicalData)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([category, data]) => ({
            name: category,
            value: data.total,
            fill: getCategoryColor(category),
            percentage: totalGastos > 0 ? (data.total / totalGastos) * 100 : 0,
            transactions: data.transactions,
            subcategories: Object.entries(data.subcategories)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([subName, subData]) => ({
                    name: subName,
                    value: subData.total,
                    transactions: subData.transactions,
                    percentage: data.total > 0 ? (subData.total / data.total) * 100 : 0
                }))
        }))

    // Find villain (highest spending category)
    const vilao = chartData[0]

    // 6-month projection
    const projecao6Meses = totalGastos * 6

    // Meta ideal (15% para investimento)
    const metaIdeal = totalGastos * 0.15

    const hasData = totalGastos > 0

    return (
        <div className="min-h-screen bg-[#F0F4F8] pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[var(--color-text-main)]">arrow_back</span>
                    </Link>
                    <h1 className="text-xl font-bold text-[var(--color-text-main)]">Diagnóstico</h1>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--color-primary)] !text-[20px]">person</span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
                {/* Month Selector */}
                <MonthSelector currentMonth={selectedMonth} currentYear={selectedYear} />

                {!hasData ? (
                    // Empty State
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <span className="material-symbols-outlined text-[80px] text-gray-300 mb-4 block">
                            analytics
                        </span>
                        <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                            Sem Dados para {selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() ? 'Este Mês' : `${selectedMonth}/${selectedYear}`}
                        </h3>
                        <p className="text-[var(--color-text-sub)] mb-6">
                            Não há transações neste período
                        </p>
                        <Link
                            href="/dashboard/import"
                            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            <span className="material-symbols-outlined">upload_file</span>
                            Importar Extrato
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Total Spending */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Gastos Totais
                                    </p>
                                    <p className="text-4xl font-bold text-[var(--color-text-main)]">
                                        R$ {totalGastos.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                                <div className="px-3 py-1.5 bg-[#E8F5E9] rounded-lg flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
                                    <span className="text-xs font-semibold text-[#2E7D32]">
                                        {selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() ? 'Este Mês' : `${selectedMonth}/${selectedYear}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Chart Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Análise Detalhada</h2>

                            {/* One Dynamic Chart */}
                            <InteractivePieChart
                                data={chartData}
                                title="Distribuição de Gastos"
                            />

                            <p className="text-xs text-center text-gray-500 italic">
                                💡 Toque na fatia para ver subcategorias. Segure para ver transações.
                            </p>
                        </div>

                        {/* Categories Breakdown */}
                        <div className="bg-[#1E3A4C] rounded-2xl p-6 shadow-lg">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                Por Categoria
                            </h3>
                            <div className="space-y-4">
                                {chartData.slice(0, 3).map((cat, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-white">{cat.name}</span>
                                            <span className="text-sm font-bold text-[#4ADE80]">
                                                {cat.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-[#0F2936] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] rounded-full transition-all"
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Villain Alert */}
                        {vilao && (
                            <div className="bg-[#1E3A4C] rounded-2xl p-6 shadow-lg border-2 border-[#F59E0B]/30">
                                <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 border border-[#F59E0B]/50 rounded-lg px-3 py-1 mb-4">
                                    <span className="material-symbols-outlined text-[#F59E0B] !text-[16px]">warning</span>
                                    <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wide">
                                        Alerta de Gastos
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Vilão: {vilao.name}
                                </h3>
                                <p className="text-gray-300">
                                    <span className="text-3xl font-bold text-white">{vilao.percentage.toFixed(0)}%</span> dos seus gastos. Isso está drenando sua reserva.
                                </p>
                            </div>
                        )}

                        {/* Grid: 6 Months + Meta Ideal */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* 6 Months Projection */}
                            <div className="bg-[#1E3A4C] rounded-2xl p-5 shadow-lg">
                                <span className="material-symbols-outlined text-red-400 !text-[32px] mb-2 block">
                                    trending_down
                                </span>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Em 6 Meses</p>
                                <p className="text-2xl font-bold text-red-400">
                                    - R$ {projecao6Meses.toFixed(0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Ponto projetado</p>
                            </div>

                            {/* Meta Ideal */}
                            <div className="bg-[#1E3A4C] rounded-2xl p-5 shadow-lg">
                                <span className="material-symbols-outlined text-[#4ADE80] !text-[32px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    grain
                                </span>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Meta Ideal</p>
                                <p className="text-2xl font-bold text-white">15%</p>
                                <p className="text-xs text-gray-400 mt-2">Investimento mensal</p>
                            </div>
                        </div>

                        {/* José Avisa Card */}
                        <div className="bg-[#1E3A4C] rounded-2xl p-6 shadow-lg border-2 border-[#4ADE80]/30">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#4ADE80]/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[#4ADE80] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        lightbulb
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-[#4ADE80] uppercase tracking-wide">
                                            José Avisa
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        Ajuste de Rota
                                    </h3>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        "Ajuste para vacas magras." Prepare-se agora para garantir fartura no futuro.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href="/dashboard/tips"
                            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#0F2936] font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            Ver Dicas de Economia
                            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
