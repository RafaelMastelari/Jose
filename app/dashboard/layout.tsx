import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const handleLogout = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-ice)] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-primary)] !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>grain</span>
                            <span className="text-xl font-bold text-[var(--color-primary-dark)]">JOSE</span>
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-[var(--color-text-main)]">
                                    {user.user_metadata?.full_name || 'Usuário'}
                                </p>
                                <p className="text-xs text-[var(--color-text-sub)]">{user.email}</p>
                            </div>
                            <form action={handleLogout}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-sub)] hover:bg-gray-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-[20px]">logout</span>
                                    <span className="hidden sm:inline">Sair</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full">
                {children}
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 sm:hidden">
                <div className="flex justify-around items-center h-16">
                    <Link href="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 text-[var(--color-primary)] hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                        <span className="text-xs font-medium mt-1">Início</span>
                    </Link>
                    <Link href="/dashboard/diagnosis" className="flex flex-col items-center justify-center flex-1 py-2 text-[var(--color-text-sub)] hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors">
                        <span className="material-symbols-outlined !text-[24px]">analytics</span>
                        <span className="text-xs font-medium mt-1">Diagnóstico</span>
                    </Link>
                    <Link href="/dashboard/import" className="flex flex-col items-center justify-center flex-1 py-2 text-[var(--color-text-sub)] hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors">
                        <span className="material-symbols-outlined !text-[24px]">upload_file</span>
                        <span className="text-xs font-medium mt-1">Importar</span>
                    </Link>
                    <Link href="/dashboard/tips" className="flex flex-col items-center justify-center flex-1 py-2 text-[var(--color-text-sub)] hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors">
                        <span className="material-symbols-outlined !text-[24px]">history_edu</span>
                        <span className="text-xs font-medium mt-1">Sabedoria</span>
                    </Link>
                    <Link href="/dashboard/settings" className="flex flex-col items-center justify-center flex-1 py-2 text-[var(--color-text-sub)] hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors">
                        <span className="material-symbols-outlined !text-[24px]">settings</span>
                        <span className="text-xs font-medium mt-1">Config</span>
                    </Link>
                </div>
            </nav>

            {/* Add padding at bottom on mobile to account for fixed nav */}
            <div className="h-16 sm:hidden" />
        </div>
    )
}
