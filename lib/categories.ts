// Category System with Subcategories
// Beautiful, professional structure for financial categorization

export interface CategoryDefinition {
    label: string
    icon: string // Material Symbols icon name
    color: string
    subs: string[]
}

export const CATEGORIES: Record<string, CategoryDefinition> = {
    food: {
        label: 'Alimentação',
        icon: 'restaurant',
        color: 'orange',
        subs: ['Mercado', 'Restaurante', 'Delivery', 'Padaria', 'Bar']
    },
    transport: {
        label: 'Transporte',
        icon: 'directions_car',
        color: 'blue',
        subs: ['Combustível', 'Público', 'Uber/App', 'Manutenção', 'Estacionamento']
    },
    housing: {
        label: 'Moradia',
        icon: 'home',
        color: 'purple',
        subs: ['Aluguel', 'Contas', 'Internet', 'Manutenção']
    },
    health: {
        label: 'Saúde',
        icon: 'medical_services',
        color: 'green',
        subs: ['Farmácia', 'Médico', 'Academia']
    },
    shopping: {
        label: 'Compras',
        icon: 'shopping_bag',
        color: 'pink',
        subs: ['Roupas', 'Eletrônicos', 'Presentes', 'Beleza']
    },
    finance: {
        label: 'Finanças',
        icon: 'account_balance',
        color: 'gray',
        subs: ['Investimento', 'Pagamento Cartão', 'Empréstimo', 'Transferência']
    },
    leisure: {
        label: 'Lazer',
        icon: 'movie',
        color: 'teal',
        subs: ['Cinema', 'Streaming', 'Games', 'Viagens', 'Hobbies']
    },
    education: {
        label: 'Educação',
        icon: 'school',
        color: 'indigo',
        subs: ['Cursos', 'Livros', 'Material Escolar']
    },
    income: {
        label: 'Receitas',
        icon: 'payments',
        color: 'green',
        subs: ['Salário', 'Freelance', 'Investimento', 'Outros']
    },
    other: {
        label: 'Outros',
        icon: 'more_horiz',
        color: 'gray',
        subs: []
    }
}

// Helper functions
export function getCategoryLabel(categoryKey: string): string {
    return CATEGORIES[categoryKey]?.label || categoryKey
}

export function getCategoryIcon(categoryKey: string): string {
    return CATEGORIES[categoryKey]?.icon || 'category'
}

export function getCategoryColor(categoryKey: string): string {
    return CATEGORIES[categoryKey]?.color || 'gray'
}

export function getSubcategories(categoryKey: string): string[] {
    return CATEGORIES[categoryKey]?.subs || []
}

// Get all categories as array for dropdowns
export function getAllCategories() {
    return Object.entries(CATEGORIES).map(([key, value]) => ({
        key,
        ...value
    }))
}

// Legacy compatibility - map old category names to new keys
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
    'Alimentação': 'food',
    'Transporte': 'transport',
    'Moradia': 'housing',
    'Saúde': 'health',
    'Compras': 'shopping',
    'Lazer': 'leisure',
    'Educação': 'education',
    'Salário': 'income',
    'Freelance': 'income',
    'Investimento': 'finance',
    'Outros': 'other'
}

export function normalizeCategoryKey(category: string): string {
    // If it's already a key, return it
    if (CATEGORIES[category]) return category

    // Try legacy mapping
    if (LEGACY_CATEGORY_MAP[category]) return LEGACY_CATEGORY_MAP[category]

    // Default to other
    return 'other'
}
