'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'

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
}

interface ChartData {
    name: string
    value: number
    fill?: string
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
                outerRadius={outerRadius + 15}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            {/* Center text - Category name */}
            <text
                x={cx}
                y={cy - 15}
                textAnchor="middle"
                fill={fill}
                fontSize={18}
                fontWeight="bold"
            >
                {payload.name}
            </text>
            {/* Center text - Value */}
            <text
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                fill="#374151"
                fontSize={16}
                fontWeight="600"
            >
                {formatCurrency(value)}
            </text>
            {/* Center text - Percentage */}
            <text
                x={cx}
                y={cy + 25}
                textAnchor="middle"
                fill="#6B7280"
                fontSize={14}
            >
                {payload.percentage}%
            </text>
        </g>
    )
}

export function InteractivePieChart({ data, title }: InteractivePieChartProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    // Ensure data has fill colors
    const dataWithColors = data.map(entry => ({
        ...entry,
        fill: entry.fill || CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Outros']
    }))

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

            {dataWithColors.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                activeShape={renderActiveShape}
                                data={dataWithColors}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                onClick={(_: any, index: number) => setActiveIndex(index)}
                            >
                                {dataWithColors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="mt-6 grid grid-cols-2 gap-2">
                        {dataWithColors.map((entry, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                onClick={() => setActiveIndex(index)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.fill }}
                                />
                                <span className="text-sm text-gray-700 truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhum dado disponível para este período</p>
                </div>
            )}
        </div>
    )
}
