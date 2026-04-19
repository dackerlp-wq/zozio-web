import type { Fundraiser } from '@/types/database'

interface FundraiserBarProps {
  fundraiser: Fundraiser
}

export function FundraiserBar({ fundraiser }: FundraiserBarProps) {
  const percent = Math.min(
    Math.round((fundraiser.current_amount / fundraiser.goal_amount) * 100),
    100
  )

  const deadline = fundraiser.deadline
    ? new Date(fundraiser.deadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="bg-coral-light rounded-lg p-5 border border-gray-pale/50">
      <h3 className="font-display font-extrabold text-lg text-espresso mb-1">
        💛 {fundraiser.title}
      </h3>

      {fundraiser.description && (
        <p className="text-sm text-brown-mid mb-4 leading-relaxed">
          {fundraiser.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="font-display font-extrabold text-xl text-espresso">
            {fundraiser.current_amount.toLocaleString('cs-CZ')} Kč
          </span>
          <span className="text-sm text-gray font-semibold">
            z {fundraiser.goal_amount.toLocaleString('cs-CZ')} Kč
          </span>
        </div>
        <div className="w-full h-3 bg-white rounded-pill overflow-hidden">
          <div
            className="h-full bg-coral rounded-pill transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-bold text-coral">
            {percent}% vybráno
          </span>
          {deadline && (
            <span className="text-xs text-gray">do {deadline}</span>
          )}
        </div>
      </div>

      <a
        href="#"
        className="inline-flex items-center justify-center w-full py-3 rounded-pill font-display font-bold text-sm text-white transition-all hover:-translate-y-0.5 bg-coral hover:bg-coral-dark"
      >
        💛 Přispět na sbírku
      </a>
    </div>
  )
}
