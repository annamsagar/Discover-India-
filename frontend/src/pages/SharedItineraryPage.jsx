import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiMapPin, FiCalendar, FiUsers, FiDollarSign, FiSunrise, FiSun, FiMoon, FiTruck, FiHome } from 'react-icons/fi'
import { getSharedItinerary } from '../services/multiItineraryService'

function ActivityRow({ activity }) {
  const typeIcons = { meal: '🍽️', transport: '🚗', rest: '💤', activity: '📍' }
  return (
    <div className="flex gap-3 items-start py-2 border-t border-white/5">
      <span className="time-badge mt-0.5">{activity.time || '—'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <span className="text-sm">{typeIcons[activity.type] || '📍'}</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{activity.name}</p>
            {activity.description && <p className="text-slate-500 text-xs mt-0.5">{activity.description}</p>}
          </div>
          {activity.estimatedCost > 0 && (
            <span className="cost-tag">₹{activity.estimatedCost.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SharedItineraryPage() {
  const { token } = useParams()

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['shared-itinerary', token],
    queryFn: () => getSharedItinerary(token).then(r => r.data),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-saffron-500/30 border-t-saffron-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading shared itinerary…</p>
        </div>
      </div>
    )
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-white font-semibold text-lg mb-2">Itinerary Not Found</p>
          <p className="text-slate-500 text-sm">This link may have expired or the itinerary was deleted.</p>
        </div>
      </div>
    )
  }

  // Parse stored JSON back to response object
  let itinerary = null
  try {
    itinerary = JSON.parse(trip.itineraryJson)
  } catch {
    itinerary = null
  }

  const summary = itinerary?.tripSummary
  const days    = itinerary?.days || []
  const budget  = itinerary?.budgetBreakdown

  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Banner */}
        <div className="glass-card rounded-2xl p-6 border border-saffron-500/30 bg-saffron-500/5 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-saffron-400 text-xs font-semibold uppercase tracking-widest mb-1">Shared Itinerary</p>
              <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5" /> {trip.startLocation}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 border border-white/10 text-center flex-shrink-0">
              <p className="text-2xl font-bold gradient-text">{trip.days}</p>
              <p className="text-slate-400 text-xs">days</p>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { icon: <FiCalendar className="w-3.5 h-3.5" />, label: 'Duration', val: `${trip.days} days` },
                { icon: <FiUsers className="w-3.5 h-3.5" />, label: 'Travelers', val: trip.travelers },
                { icon: <FiDollarSign className="w-3.5 h-3.5" />, label: 'Budget/Person', val: `₹${trip.budgetPerPerson?.toLocaleString('en-IN')}` },
                { icon: <FiMapPin className="w-3.5 h-3.5" />, label: 'Distance', val: `~${Math.round(summary.totalDistanceKm || 0)} km` },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1 text-saffron-400 text-xs mb-1">{s.icon} {s.label}</div>
                  <p className="text-white font-semibold text-sm">{s.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route */}
        {summary?.route?.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-white/10 mb-6">
            <p className="section-label mb-3">Route</p>
            <div className="flex flex-wrap items-center gap-2">
              {summary.route.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-saffron-500/20 text-saffron-400 text-xs flex items-center justify-center font-bold">{i}</span>
                    <span className="text-white text-sm">{stop}</span>
                  </div>
                  {i < summary.route.length - 1 && <span className="text-saffron-400">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day-by-day */}
        <div className="space-y-4 mb-8">
          <h2 className="text-white font-bold text-xl">Day-by-Day Itinerary</h2>
          {days.map(day => (
            <div key={day.day} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              {/* Day header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-saffron-500/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-sm">
                  {day.day}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{day.location}</h3>
                  {day.date && <p className="text-slate-500 text-xs">{day.date} {day.theme && `· ${day.theme}`}</p>}
                </div>
                {day.estimatedCost > 0 && (
                  <span className="ml-auto text-emerald-400 text-sm font-semibold">₹{day.estimatedCost.toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Travel */}
                {day.travel?.from && (
                  <div className="flex items-center gap-2 bg-blue-500/5 rounded-xl px-3 py-2 border border-blue-500/15">
                    <FiTruck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-300">{day.travel.from} → {day.travel.to}</span>
                    {day.travel.estimatedTime && <span className="text-xs text-slate-500">· {day.travel.estimatedTime}</span>}
                    {day.travel.estimatedCost > 0 && (
                      <span className="cost-tag ml-auto">₹{day.travel.estimatedCost.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                )}

                {/* Morning */}
                {day.morning?.length > 0 && (
                  <div>
                    <p className="section-label flex items-center gap-1 mb-1"><FiSunrise className="w-3 h-3" /> Morning</p>
                    {day.morning.map((a, i) => <ActivityRow key={i} activity={a} />)}
                  </div>
                )}

                {/* Afternoon */}
                {day.afternoon?.length > 0 && (
                  <div>
                    <p className="section-label flex items-center gap-1 mb-1"><FiSun className="w-3 h-3" /> Afternoon</p>
                    {day.afternoon.map((a, i) => <ActivityRow key={i} activity={a} />)}
                  </div>
                )}

                {/* Evening */}
                {day.evening?.length > 0 && (
                  <div>
                    <p className="section-label flex items-center gap-1 mb-1"><FiMoon className="w-3 h-3" /> Evening</p>
                    {day.evening.map((a, i) => <ActivityRow key={i} activity={a} />)}
                  </div>
                )}

                {/* Accommodation */}
                {day.accommodation?.area && (
                  <div className="flex items-start gap-2 bg-purple-500/5 border border-purple-500/15 rounded-xl px-3 py-2">
                    <FiHome className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <p className="text-slate-300 font-medium">{day.accommodation.type} — {day.accommodation.area}</p>
                      <p className="text-slate-500">Check-in: {day.accommodation.checkIn} · Check-out: {day.accommodation.checkOut}</p>
                    </div>
                    {day.accommodation.estimatedCostPerNight > 0 && (
                      <span className="cost-tag">₹{day.accommodation.estimatedCostPerNight.toLocaleString('en-IN')}/night</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Budget summary */}
        {budget && (
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiDollarSign className="text-saffron-400" /> Budget Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Accommodation', value: budget.accommodation },
                { label: 'Transport',     value: budget.transport },
                { label: 'Food',          value: budget.food },
                { label: 'Activities',    value: budget.activities },
                { label: 'Misc',          value: budget.miscellaneous },
                { label: 'Total',         value: budget.total, highlight: true },
              ].map(r => (
                <div key={r.label} className={`glass-card rounded-xl p-3 border ${r.highlight ? 'border-saffron-500/30 bg-saffron-500/5' : 'border-white/10'}`}>
                  <p className="section-label mb-0.5">{r.label}</p>
                  <p className={`font-semibold text-sm ${r.highlight ? 'text-saffron-400' : 'text-white'}`}>
                    ₹{(r.value || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Shared via <span className="text-saffron-400 font-semibold">Discover India</span> · Plan your own trip at{' '}
            <a href="/planner" className="text-saffron-400 hover:underline">discoverindia.com/planner</a>
          </p>
        </div>
      </div>
    </div>
  )
}
