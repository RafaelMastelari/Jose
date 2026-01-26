// Client-side category helpers (for use in client components)
import { CATEGORIES, type CategoryDefinition } from './categories'

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

export function getAllCategories() {
    return Object.entries(CATEGORIES).map(([key, value]) => ({
        key,
        ...value
    }))
}

export { CATEGORIES }
export type { CategoryDefinition }
