/**
 * AppChoicePage - Choose your experience after signing in
 *
 * Shown after successful authentication (email or OAuth)
 */

import { Smartphone, Monitor, ArrowRight } from 'lucide-react'

interface AppChoicePageProps {
  userName?: string
  onSelectMobileReview: () => void
  onSelectDesktop: () => void
}

export function AppChoicePage({ userName, onSelectMobileReview, onSelectDesktop }: AppChoicePageProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#e2e8f0]">
            {userName ? `Welcome, ${userName}!` : 'Welcome!'}
          </h1>
          <p className="text-[#94a3b8] mt-2">Choose how you want to work</p>
        </div>

        {/* App Choice Cards */}
        <div className="space-y-4">
          {/* Mobile Review App */}
          <button
            onClick={onSelectMobileReview}
            className="w-full p-5 bg-[#1e293b] hover:bg-[#334155]/80 border border-[#334155] hover:border-[#06b6d4]/50 rounded-lg text-left transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#06b6d4]/20 text-[#06b6d4]">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#e2e8f0]">Mobile Review App</h3>
                <p className="text-sm text-[#94a3b8]">
                  Quick review on your phone
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#64748b] group-hover:text-[#06b6d4] group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          {/* Desktop Site */}
          <button
            onClick={onSelectDesktop}
            className="w-full p-5 bg-[#1e293b] hover:bg-[#334155]/80 border border-[#334155] hover:border-[#475569] rounded-lg text-left transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#334155] text-[#94a3b8]">
                <Monitor className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#e2e8f0]">Desktop Site</h3>
                <p className="text-sm text-[#94a3b8]">
                  Full dashboard experience
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#64748b] group-hover:text-[#e2e8f0] group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
