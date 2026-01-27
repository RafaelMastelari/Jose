'use client'

import { useState, useRef, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { ChartDetailsDrawer, ChartTransaction } from './ChartDetailsDrawer'

// Themed category colors for consistency
const CATEGORY_COLORS: Record<string, string> = {
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

export interface ChartData {
    name: string
    value: number
    fill?: string
    // Nested data for drill-down
    subcategories?: ChartData[]
    // Related transactions for long-press
    transactions?: ChartTransaction[]
}

interface InteractivePieChartProps {
    data: ChartData[]
    title: string
}

// Custom active shape renderer for enhanced interaction
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val)
    }

    return (
        <g>
            {/* Enhanced larger slice */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 12}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            {/* Center text - Category name */}
            <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fill="#1F2937"
                fontSize={16}
                fontWeight="bold"
            >
                {payload.name}
            </text>
            {/* Center text - Value */}
            <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                fill="#4B5563"
                fontSize={14}
                fontWeight="600"
            >
                {formatCurrency(value)}
            </text>
        </g>
    )
}

export function InteractivePieChart({ data, title }: InteractivePieChartProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [viewLevel, setViewLevel] = useState<'category' | 'subcategory'>('category')
    const [selectedCategory, setSelectedCategory] = useState<ChartData | null>(null)

    // For long press
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
    const [isLongPress, setIsLongPress] = useState(false)

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerData, setDrawerData] = useState<{ title: string, transactions: ChartTransaction[], color: string } | null>(null)

    // Ensure data has fill colors
    const enrichedData = useMemo(() => {
        return data.map(entry => ({
            ...entry,
            fill: entry.fill || CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Outros']
        }))
    }, [data])

    // Determine current data to display
    const currentData = useMemo(() => {
        if (viewLevel === 'category') {
            return enrichedData
        }
        if (selectedCategory && selectedCategory.subcategories) {
            return selectedCategory.subcategories.map(sub => ({
                ...sub,
                fill: selectedCategory.fill // Keep parent color for subcategories or generate shades?
                // For simplicity and consistency request: "Use CATEGORY_COLORS mapping"
                // But subcategories usually don't have their own global colors.
                // Optimally: shades of parent color or simple opacity.
                // Let's stick to parent color for now or allow subcategory specific if provided.
            }))
        }
        return []
    }, [viewLevel, selectedCategory, enrichedData])

    const handleBack = () => {
        setViewLevel('category')
        setSelectedCategory(null)
        setActiveIndex(0)
    }

    // Interaction Handlers
    const handleMouseDown = (entry: ChartData, index: number) => {
        // Start long press timer
        setIsLongPress(false)
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPress(true)
            // Trigger Long Press Action
            if (entry.transactions && entry.transactions.length > 0) {
                setDrawerData({
                    title: entry.name,
                    transactions: entry.transactions,
                    color: entry.fill || '#ccc'
                })
                setDrawerOpen(true)
            }
        }, 500) // 500ms for long press
    }

    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
    }

    const handleClick = (entry: ChartData, index: number) => {
        // Only if it wasn't a long press
        if (!isLongPress) {
            if (viewLevel === 'category' && entry.subcategories && entry.subcategories.length > 0) {
                // Drill down
                setSelectedCategory(entry)
                setViewLevel('subcategory')
                setActiveIndex(0)
            } else {
                // Just highlight
                setActiveIndex(index)
            }
        }
        setIsLongPress(false)
    }

    // Touch events for mobile
    const handleTouchStart = (entry: ChartData) => {
        setIsLongPress(false)
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPress(true)
            if (entry.transactions && entry.transactions.length > 0) {
                setDrawerData({
                    title: entry.name,
                    transactions: entry.transactions,
                    color: entry.fill || '#ccc'
                })
                setDrawerOpen(true)
            }
        }, 500)
    }

    const handleTouchEnd = (e: any) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
        // e.preventDefault() // might interfere with scrolling
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                    {viewLevel === 'category' ? title : `Detalhes: ${selectedCategory?.name}`}
                </h3>
                {viewLevel === 'subcategory' && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[var(--color-primary)] transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                    >
                        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                        Voltar
                    </button>
                )}
            </div>

            {currentData.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                activeShape={renderActiveShape}
                                {...{ activeIndex } as any}
                                data={currentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                dataKey="value"
                                paddingAngle={2}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onClick={(_, index) => handleClick(currentData[index], index)}
                                onMouseDown={(_, index) => handleMouseDown(currentData[index], index)}
                                onMouseUp={handleMouseUp}
                                onTouchStart={(_, index) => handleTouchStart(currentData[index])}
                                onTouchEnd={handleTouchEnd}
                                style={{ outline: 'none' }}
                            >
                                {currentData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        stroke="none"
                                        style={{ outline: 'none' }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Legend / Interactive List */}
                    <div className="mt-6 grid grid-cols-2 gap-2">
                        {currentData.map((entry, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${index === activeIndex ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => handleClick(entry, index)}
                                onMouseDown={() => handleMouseDown(entry, index)}
                                onMouseUp={handleMouseUp}
                                onTouchStart={() => handleTouchStart(entry)}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.fill }}
                                />
                                <span className="text-sm text-gray-700 truncate flex-1 leading-tight">
                                    {entry.name}
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {Math.round((entry.value / (currentData.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhum dado disponível</p>
                </div>
            )}

            {/* Drill-down Drawer */}
            {drawerData && (
                <ChartDetailsDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={drawerData.title}
                    transactions={drawerData.transactions}
                    color={drawerData.color}
                />
            )}
        </div>
    )
}
