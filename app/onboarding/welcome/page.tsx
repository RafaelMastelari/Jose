'use client'

import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-hidden bg-[var(--color-background-ice)] shadow-2xl ring-1 ring-black/5">
      {/* Background Gradient Blobs */}
      <div className="absolute top-[-20%] right-[-20%] h-[500px] w-[500px] rounded-full bg-gradient-to-b from-[var(--color-primary)]/10 to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-[var(--color-primary)]/5 blur-3xl pointer-events-none"></div>

      {/* Top Navigation: Skip Button Only */}
      <div className="relative z-20 flex w-full items-center justify-end p-4">
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--color-text-sub)] hover:text-[var(--color-primary)] transition-colors"
        >
          Pular
        </Link>
      </div>

      {/* Header Logo */}
      <header className="relative z-10 flex w-full items-center justify-center pb-4">
        <div className="flex items-center gap-2 rounded-full bg-white/60 px-5 py-2 backdrop-blur-md shadow-sm border border-white/50">
          <span className="material-symbols-outlined text-[var(--color-primary)] !text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>grain</span>
          <span className="text-sm font-bold tracking-widest uppercase text-[var(--color-primary-dark)]">JOSE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pb-8 pt-4">
        <div className="flex w-full flex-col items-center justify-center flex-grow">
          {/* Security Card with 3D Lock */}
          <div className="relative w-full aspect-[4/5] max-h-[440px] rounded-[2rem] bg-white shadow-[var(--shadow-card)] p-6 border border-white flex flex-col items-center justify-between overflow-hidden group transition-all duration-500 hover:shadow-[var(--shadow-glow)]">
            {/* Dot Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

            {/* Security Badge */}
            <div className="relative z-10 w-full flex justify-end">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-light)]/50 px-3 py-1 border border-[var(--color-primary)]/10 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">Seguro</span>
              </div>
            </div>

            {/* 3D Lock Icon with Animations */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-grow">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-white to-[var(--color-primary-light)] shadow-lg ring-1 ring-white/50">
                <span className="material-symbols-outlined !text-[72px] text-[var(--color-primary)] drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>

                {/* Rotating decorative circles - behind the lock */}
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[var(--color-primary)]/20 blur-[1px] animate-[orbit_8s_linear_infinite] origin-center"></div>
                <div className="absolute bottom-4 left-4 h-6 w-6 rounded-full bg-[var(--color-primary)]/10 blur-[2px] animate-[orbit_12s_linear_infinite_reverse] origin-center"></div>

                <div className="absolute inset-0 rounded-full border border-[var(--color-primary)]/10 border-dashed animate-[spin_12s_linear_infinite]"></div>
              </div>
              {/* Shadow underneath */}
              <div className="mt-8 h-4 w-24 rounded-[100%] bg-[var(--color-primary)]/10 blur-md scale-x-150"></div>
            </div>

            {/* Status Bar with slow loading animation */}
            <div className="relative z-10 w-full">
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)]/40 animate-[progressFill_3s_ease-out]"></div>
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-gray-400">
                <span>Status do sistema</span>
                <span>Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Title, Progress, Button */}
        <div className="flex w-full flex-col items-center gap-6 pt-8">
          <div className="text-center space-y-3 max-w-xs">
            <h1 className="text-[28px] font-extrabold text-[var(--color-text-main)] leading-tight tracking-tight">
              Bem-vindo ao Jose
            </h1>
            <p className="text-[var(--color-text-sub)] text-lg font-medium leading-relaxed">
              Seu guardião financeiro
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-8 rounded-full bg-[var(--color-primary)] shadow-sm"></div>
            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          </div>

          {/* Next Button */}
          <Link
            href="/onboarding/wisdom"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all hover:bg-[var(--color-primary-dark)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-lg font-bold">Entendi</span>
            <span className="material-symbols-outlined !text-[20px] font-bold">arrow_forward</span>
          </Link>
        </div>
      </main>

      <div className="h-2 w-full"></div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 66.666%;
          }
        }

        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(50px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(50px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  )
}
