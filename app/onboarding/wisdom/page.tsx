'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function FinancialWisdomPage() {
    const router = useRouter()

    return (
        <div className="relative flex h-full min-h-screen w-full max-w-[480px] flex-col overflow-hidden bg-[#F0F4F8] shadow-2xl mx-auto">
            {/* Background Gradient Blobs */}
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] bg-[var(--color-primary)]/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-[var(--color-mint-green)]/20 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Header with Back and Skip */}
            <header className="flex w-full items-center justify-between p-4 z-20">
                <button
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#0A2530] hover:bg-black/5 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <Link
                    href="/login"
                    className="text-sm font-medium text-[var(--color-text-sub)] hover:text-[var(--color-primary)] transition-colors"
                >
                    Pular
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center w-full px-4 pt-4 pb-8 z-10 overflow-y-auto">
                {/* Image Card with Beautiful Wheat/Chart Image */}
                <div className="w-full relative aspect-[4/5] max-h-[50vh] mb-8 rounded-2xl overflow-hidden group shadow-lg shadow-[var(--color-primary)]/10">
                    {/* High Quality Wheat/Chart Image */}
                    <div className="absolute inset-0">
                        <Image
                            src="/wisdom-wheat.jpg"
                            alt="Crescimento financeiro estratégico"
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            priority
                        />
                    </div>

                    {/* Light gradient fade at bottom for badge readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F0F4F8] via-transparent to-transparent opacity-40 pointer-events-none"></div>

                    {/* Icon Badge at bottom */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md rounded-full border border-[var(--color-primary)]/20 shadow-xl z-10">
                        <span className="material-symbols-outlined text-[var(--color-primary)] !text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>area_chart</span>
                        <span className="text-xs font-bold text-[#0A2530] tracking-wide uppercase">Estratégia</span>
                    </div>
                </div>

                {/* Title and Description */}
                <div className="flex flex-col items-center text-center max-w-xs mx-auto">
                    <h1 className="text-[#0A2530] tracking-tight text-[32px] font-bold leading-[1.2] mb-4">
                        Crescimento Estratégico
                    </h1>
                    <p className="text-[var(--color-text-sub)] text-base font-normal leading-relaxed">
                        Planeje seu futuro com inteligência e estratégia.
                    </p>
                </div>
            </main>

            {/* Footer with Progress and Buttons */}
            <footer className="w-full flex flex-col items-center px-6 pb-8 pt-4 gap-6 z-20 bg-[#F0F4F8]">
                {/* Progress Dots */}
                <div className="flex w-full flex-row items-center justify-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gray-300 transition-colors duration-300"></div>
                    <div className="h-2 w-8 rounded-full bg-[var(--color-primary)] shadow-[0_0_12px_rgba(0,109,119,0.5)] transition-all duration-300"></div>
                </div>

                {/* "Começar" Button - Mint Green */}
                <div className="w-full">
                    <Link
                        href="/login"
                        className="relative w-full overflow-hidden rounded-xl bg-[#4ADE80] h-14 px-5 text-[#0A2530] text-lg font-bold leading-normal hover:bg-[#86efac] active:scale-[0.99] transition-all shadow-lg shadow-[#4ADE80]/25 flex items-center justify-center gap-2 group"
                    >
                        <span>Começar</span>
                        <span className="material-symbols-outlined !text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </Link>
                </div>

                {/* "Already have account" link */}
                <Link
                    href="/login"
                    className="text-sm font-semibold text-[var(--color-text-sub)] hover:text-[var(--color-primary)] transition-colors"
                >
                    Já tenho uma conta
                </Link>
            </footer>
        </div>
    )
}
