import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FiPlus, FiTrash2, FiCalendar, FiMapPin, FiCpu,
  FiDownload, FiMap, FiList, FiNavigation, FiDollarSign,
  FiUsers, FiChevronUp, FiChevronDown, FiSave, FiShare2,
  FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw,
  FiSun, FiSunrise, FiMoon, FiTruck, FiHome, FiX,
  FiZap, FiInfo, FiArrowRight, FiTrendingDown, FiTrendingUp,
  FiTarget, FiAward, FiActivity,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuthStore } from '../store/authStore'
import { useTripStore } from '../store/tripStore'
import { generateMultiItinerary, saveItinerary, shareItinerary } from '../services/multiItineraryService'

// Fix Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeNumberedIcon = (num, color = '#ff7a0f') => L.divIcon({
  html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 8px rgba(0,0,0,0.4)">${num}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const TRAVEL_TYPES = [
  { value: 'solo',     label: '🧳 Solo' },
  { value: 'couple',   label: '💑 Couple' },
  { value: 'family',   label: '👨‍👩‍👧 Family' },
  { value: 'friends',  label: '🎉 Friends' },
  { value: 'business', label: '💼 Business' },
]

const INTERESTS = [
  { value: 'nature',       label: '🌿 Nature' },
  { value: 'beaches',      label: '🏖️ Beaches' },
  { value: 'adventure',    label: '🧗 Adventure' },
  { value: 'history',      label: '🏛️ History' },
  { value: 'temples',      label: '🛕 Temples' },
  { value: 'food',         label: '🍛 Food' },
  { value: 'shopping',     label: '🛍️ Shopping' },
  { value: 'wildlife',     label: '🐆 Wildlife' },
  { value: 'photography',  label: '📸 Photography' },
  { value: 'nightlife',    label: '🌃 Nightlife' },
]

const TRANSPORT_OPTIONS = [
  { value: 'car',    label: '🚗 Car' },
  { value: 'bike',   label: '🏍️ Bike' },
  { value: 'bus',    label: '🚌 Bus' },
  { value: 'train',  label: '🚂 Train' },
  { value: 'flight', label: '✈️ Flight' },
  { value: 'mixed',  label: '🔀 Mixed' },
]

const PACE_OPTIONS = [
  { value: 'relaxed',  label: '😌 Relaxed', desc: '2–3 activities/day' },
  { value: 'balanced', label: '⚖️ Balanced', desc: '3–4 activities/day' },
  { value: 'fast',     label: '⚡ Fast',     desc: '5+ activities/day' },
]

const HOTEL_OPTIONS = [
  { value: 'budget',   label: '🏕️ Budget',   desc: '₹500–1,200/night' },
  { value: 'standard', label: '🏨 Standard', desc: '₹1,500–3,000/night' },
  { value: 'luxury',   label: '👑 Luxury',   desc: '₹4,000+/night' },
]

const FOOD_OPTIONS = [
  { value: 'vegetarian',    label: '🥗 Vegetarian' },
  { value: 'nonVegetarian', label: '🍗 Non-Vegetarian' },
  { value: 'both',          label: '🍱 Both' },
]

const LOADING_STEPS = [
  'Validating destinations',
  'Geocoding locations',
  'Optimizing route',
  'Calculating travel time',
  'Selecting attractions',
  'Building daily schedule',
  'Calculating budget',
  'Generating itinerary',
]

// ── Map helpers ───────────────────────────────────────────────────────────────
function FitBounds({ locations }) {
  const map = useMap()
  useEffect(() => {
    if (locations?.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [locations, map])
  return null
}

function RouteLayer({ locations }) {
  const [routePoints, setRoutePoints] = useState([])
  useEffect(() => {
    if (!locations || locations.length < 2) { setRoutePoints([]); return }
    const coords = locations.map(l => `${l.lng},${l.lat}`).join(';')
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) {
          setRoutePoints(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
        }
      })
      .catch(() => setRoutePoints(locations.map(l => [l.lat, l.lng])))
  }, [locations])
  if (!routePoints.length) return null
  return <Polyline positions={routePoints} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.8, dashArray: '10, 5' }} />
}

// ── Preview Map ───────────────────────────────────────────────────────────────
function PreviewMap({ startLocation, destinations, selectedLocations }) {
  const locations = [startLocation, ...destinations]
    .filter(d => d && d.trim() && selectedLocations[d])
    .map((d, i) => ({ name: d, lat: selectedLocations[d].lat, lng: selectedLocations[d].lng, isStart: i === 0 }))
    
  const uniqueLocs = []
  const seen = new Set()
  locations.forEach(l => {
     const key = `${l.lat},${l.lng}`
     if(!seen.has(key)) { seen.add(key); uniqueLocs.push(l) }
  })

  const center = uniqueLocs.length > 0 ? [uniqueLocs[0].lat, uniqueLocs[0].lng] : [20.5937, 78.9629]

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col h-full min-h-[600px]">
       <div className="p-5 border-b border-white/10 bg-white/5">
         <h3 className="text-white font-semibold flex items-center gap-2"><FiMap className="text-saffron-400" /> Live Map Preview</h3>
         <p className="text-slate-400 text-sm mt-1">Map updates when you select a destination</p>
       </div>
       <div className="flex-1 relative bg-[#1e293b]">
         <MapContainer center={center} zoom={uniqueLocs.length > 0 ? 5 : 4} style={{ height: '100%', width: '100%', background: '#1e293b' }}>
           <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
           />
           {uniqueLocs.map((loc, i) => (
              <Marker key={i} position={[loc.lat, loc.lng]} icon={makeNumberedIcon(loc.isStart ? 'S' : i, loc.isStart ? '#10b981' : '#ff7a0f')}>
                 <Popup><div className="text-sm"><strong>{loc.name}</strong></div></Popup>
              </Marker>
           ))}
           <FitBounds locations={uniqueLocs} />
         </MapContainer>
       </div>
    </div>
  )
}

// ── Loading overlay ───────────────────────────────────────────────────────────
function LoadingOverlay({ step }) {
  return (
    <div className="glass-card rounded-2xl p-10 border border-white/10 flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-saffron-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-saffron-500 animate-spin" />
        <FiCpu className="absolute inset-0 m-auto w-6 h-6 text-saffron-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-center mb-1">Creating your perfect trip…</p>
        <p className="text-slate-400 text-sm text-center">This usually takes 10–20 seconds</p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        {LOADING_STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : ''
          return (
            <div key={s} className={`progress-step ${state}`}>
              <div className="step-icon">
                {i < step ? '✓' : i === step ? '…' : ''}
              </div>
              {s}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ activity, onRemove, editable }) {
  const [showMeta, setShowMeta] = useState(false)
  const typeIcons = { meal: '🍽️', transport: '🚗', rest: '💤', activity: '📍' }
  return (
    <div className="flex gap-3 items-start py-2 group">
      <span className="time-badge mt-0.5">{activity.time || '—'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-sm mr-1">{typeIcons[activity.type] || '📍'}</span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-sm font-medium leading-snug">{activity.name}</p>
              {(activity.costReason || activity.tip) && (
                <button
                  onClick={() => setShowMeta(m => !m)}
                  className="text-slate-600 hover:text-saffron-400 transition-colors flex-shrink-0"
                  title="Why this cost / tip">
                  <FiInfo className="w-3 h-3" />
                </button>
              )}
            </div>
            {activity.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{activity.description}</p>}
            {showMeta && (
              <div className="mt-1.5 space-y-1">
                {activity.costReason && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/15 rounded-lg px-2 py-1">
                    <FiDollarSign className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{activity.costReason}</span>
                  </div>
                )}
                {activity.tip && (
                  <div className="flex items-start gap-1.5 text-xs text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-2 py-1">
                    <FiZap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{activity.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {activity.estimatedCost > 0 && (
            <span className="cost-tag flex-shrink-0">₹{activity.estimatedCost.toLocaleString('en-IN')}</span>
          )}
          {editable && (
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0">
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {activity.duration && <p className="text-slate-600 text-xs mt-0.5 ml-5">⏱ {activity.duration}</p>}
      </div>
    </div>
  )
}

// ── Day Card ──────────────────────────────────────────────────────────────────
function DayCard({ day, editable, onRemoveActivity }) {
  const [expanded, setExpanded] = useState(true)
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="glass-card day-card rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
          {day.day}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{day.location}</h3>
            {day.theme && <span className="badge badge-saffron text-xs">{day.theme}</span>}
          </div>
          {day.date && <p className="text-slate-500 text-xs mt-0.5">{day.date}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {day.estimatedCost > 0 && (
            <span className="text-emerald-400 text-xs font-semibold">
              ₹{day.estimatedCost.toLocaleString('en-IN')}
            </span>
          )}
          {day.dayReasoning && (
            <button
              onClick={e => { e.stopPropagation(); setShowReasoning(r => !r) }}
              className="text-saffron-400/60 hover:text-saffron-400 transition-colors"
              title="Why this day plan?">
              <FiZap className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <FiChevronUp className="w-4 h-4 text-slate-500" /> : <FiChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Day reasoning */}
          {showReasoning && day.dayReasoning && (
            <div className="flex items-start gap-2 bg-saffron-500/5 border border-saffron-500/20 rounded-xl px-3 py-2">
              <FiZap className="w-3.5 h-3.5 text-saffron-400 flex-shrink-0 mt-0.5" />
              <p className="text-saffron-200/80 text-xs leading-relaxed">{day.dayReasoning}</p>
            </div>
          )}

          {/* Travel info */}
          {day.travel?.from && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <FiTruck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="text-xs text-slate-300 flex-wrap flex gap-1 flex-1">
                  <span className="font-medium">{day.travel.from}</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-medium">{day.travel.to}</span>
                  {day.travel.distanceKm > 0 && <span className="text-slate-500">· {Math.round(day.travel.distanceKm)} km</span>}
                  {day.travel.estimatedTime && <span className="text-slate-500">· {day.travel.estimatedTime}</span>}
                </div>
                {day.travel.estimatedCost > 0 && (
                  <span className="cost-tag ml-auto">₹{day.travel.estimatedCost.toLocaleString('en-IN')}</span>
                )}
              </div>
              {day.travel.modeReason && (
                <p className="text-blue-300/60 text-xs ml-6 leading-relaxed">💡 {day.travel.modeReason}</p>
              )}
            </div>
          )}

          {/* Morning */}
          {day.morning?.length > 0 && (
            <div>
              <p className="section-label flex items-center gap-1 mb-1"><FiSunrise className="w-3 h-3" /> Morning</p>
              <div className="divide-y divide-white/5">
                {day.morning.map((act, i) => (
                  <ActivityRow key={i} activity={act} editable={editable}
                    onRemove={() => onRemoveActivity(day.day, 'morning', i)} />
                ))}
              </div>
            </div>
          )}

          {/* Afternoon */}
          {day.afternoon?.length > 0 && (
            <div>
              <p className="section-label flex items-center gap-1 mb-1"><FiSun className="w-3 h-3" /> Afternoon</p>
              <div className="divide-y divide-white/5">
                {day.afternoon.map((act, i) => (
                  <ActivityRow key={i} activity={act} editable={editable}
                    onRemove={() => onRemoveActivity(day.day, 'afternoon', i)} />
                ))}
              </div>
            </div>
          )}

          {/* Evening */}
          {day.evening?.length > 0 && (
            <div>
              <p className="section-label flex items-center gap-1 mb-1"><FiMoon className="w-3 h-3" /> Evening</p>
              <div className="divide-y divide-white/5">
                {day.evening.map((act, i) => (
                  <ActivityRow key={i} activity={act} editable={editable}
                    onRemove={() => onRemoveActivity(day.day, 'evening', i)} />
                ))}
              </div>
            </div>
          )}

          {/* Accommodation */}
          {day.accommodation?.area && (
            <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl px-3 py-2 space-y-1">
              <div className="flex items-start gap-2">
                <FiHome className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="text-slate-300 font-medium">{day.accommodation.type || 'Hotel'} — {day.accommodation.area}</p>
                  <p className="text-slate-500">
                    Check-in: {day.accommodation.checkIn || '2:00 PM'} · Check-out: {day.accommodation.checkOut || '11:00 AM'}
                  </p>
                </div>
                {day.accommodation.estimatedCostPerNight > 0 && (
                  <span className="cost-tag">₹{day.accommodation.estimatedCostPerNight.toLocaleString('en-IN')}/night</span>
                )}
              </div>
              {day.accommodation.locationReason && (
                <p className="text-purple-300/60 text-xs ml-6 leading-relaxed">📍 {day.accommodation.locationReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ budget, travelers, budgetExplanations }) {
  if (!budget) return null
  const pct = Math.min(100, (budget.total / budget.budget) * 100)
  const meterClass = pct < 80 ? 'safe' : pct < 100 ? 'warning' : 'danger'
  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`
  const rows = [
    { label: 'Accommodation', icon: '🏨', value: budget.accommodation },
    { label: 'Transportation', icon: '🚗', value: budget.transport },
    { label: 'Food & Dining', icon: '🍛', value: budget.food },
    { label: 'Activities',    icon: '🎭', value: budget.activities },
    { label: 'Miscellaneous', icon: '🛍️', value: budget.miscellaneous },
  ]

  // Map explanations by category name for easy lookup
  const explMap = {}
  ;(budgetExplanations || []).forEach(e => { explMap[e.category] = e })

  return (
    <div className="space-y-5">
      {/* Budget meter */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="section-label mb-1">Estimated Total Cost</p>
            <p className="text-3xl font-bold gradient-text">{fmt(budget.total)}</p>
            <p className="text-slate-500 text-xs mt-0.5">per person × {travelers} travelers = {fmt(budget.total * travelers)} total</p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">Your Budget</p>
            <p className="text-white font-semibold">{fmt(budget.budget)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{budget.budgetUtilizationPct ?? Math.round(pct)}% utilised</p>
          </div>
        </div>
        <div className="budget-meter mb-2">
          <div className={`budget-meter-fill ${meterClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">₹0</span>
          <span className={budget.overBudget ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {budget.overBudget
              ? `₹${(budget.total - budget.budget).toLocaleString('en-IN')} over budget`
              : `₹${(budget.budget - budget.total).toLocaleString('en-IN')} remaining`}
          </span>
          <span className="text-slate-500">{fmt(budget.budget)}</span>
        </div>

        {/* Cost range comparison */}
        {budget.minPossibleCost > 0 && budget.maxPossibleCost > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="section-label mb-2 text-center">Cost Spectrum (per person)</p>
            <div className="flex items-center gap-3 text-xs">
              <div className="text-center">
                <p className="text-emerald-400 font-bold">{fmt(budget.minPossibleCost)}</p>
                <p className="text-slate-600">Budget min</p>
              </div>
              <div className="flex-1 relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-saffron-400 to-red-500 rounded-full" />
                {/* Your cost pointer */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-saffron-500 shadow-lg"
                  style={{
                    left: `${Math.min(95, Math.max(2, ((budget.total - budget.minPossibleCost) / (budget.maxPossibleCost - budget.minPossibleCost)) * 100))}%`
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-red-400 font-bold">{fmt(budget.maxPossibleCost)}</p>
                <p className="text-slate-600">Premium max</p>
              </div>
            </div>
            <p className="text-center text-xs text-saffron-400 mt-2 font-medium">Your plan: {fmt(budget.total)}</p>
          </div>
        )}
      </div>

      {/* Breakdown with explanations */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-saffron-400" /> Cost Breakdown <span className="text-slate-500 text-xs font-normal">(tap ℹ to see why)</span>
        </h3>
        <div className="space-y-4">
          {rows.map(r => {
            const expl = explMap[r.label]
            const [open, setOpen] = useState(false)
            const barPct = budget.total > 0 ? (r.value / budget.total) * 100 : 0
            return (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{r.icon}</span>
                    <span className="text-slate-300 text-sm">{r.label}</span>
                    {expl && (
                      <button onClick={() => setOpen(o => !o)}
                        className="text-slate-600 hover:text-saffron-400 transition-colors">
                        <FiInfo className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-white font-medium text-sm">{fmt(r.value)}</span>
                </div>
                {/* Mini bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-saffron-500 to-saffron-400 rounded-full transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                {/* Explanation panel */}
                {open && expl && (
                  <div className="mt-2 bg-slate-900/60 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                    <p className="text-slate-400">
                      <span className="text-saffron-400 font-medium">Basis: </span>{expl.basis}
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      <span className="text-white font-medium">Why this amount: </span>{expl.whyThisAmount}
                    </p>
                    {/* Alternatives */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {expl.cheaperOption > 0 && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <FiTrendingDown className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">{fmt(expl.cheaperOption)}</span>
                          </div>
                          <p className="text-slate-500 leading-tight">{expl.cheaperLabel}</p>
                        </div>
                      )}
                      {expl.premiumOption > 0 && (
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <FiTrendingUp className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-400 font-semibold">{fmt(expl.premiumOption)}</span>
                          </div>
                          <p className="text-slate-500 leading-tight">{expl.premiumLabel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-saffron-400 font-bold text-lg">{fmt(budget.total)}</span>
          </div>
        </div>
      </div>

      {/* Suggestions if over budget */}
      {budget.overBudget && budget.suggestions?.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-orange-500/30 bg-orange-500/5">
          <h4 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4" /> Budget Suggestions
          </h4>
          <ul className="space-y-2">
            {budget.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-orange-400 flex-shrink-0 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// \u2500\u2500 Overview / Route summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function OverviewTab({ summary, warnings }) {
  if (!summary) return null
  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/30 bg-red-500/5">
          {warnings.map((w, i) => (
            <p key={i} className="text-red-300 text-sm flex gap-2"><FiAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{w}</p>
          ))}
        </div>
      )}

      {/* Route */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <p className="section-label mb-4">Optimized Route</p>
        <div className="flex flex-wrap items-center gap-2">
          {(summary.route || []).map((stop, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-xl border border-white/10">
                <span className="w-5 h-5 rounded-full bg-saffron-500/20 text-saffron-400 text-xs flex items-center justify-center font-bold">{i}</span>
                <span className="text-white text-sm font-medium">{stop}</span>
              </div>
              {i < summary.route.length - 1 && <span className="text-saffron-400 text-lg">&rarr;</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Days',    value: `${summary.totalDays} days`, icon: '📅' },
          { label: 'Travelers',     value: summary.travelers,           icon: '👥' },
          { label: 'Distance',      value: `~${Math.round(summary.totalDistanceKm || 0)} km`, icon: '📍' },
          { label: 'Est. Cost',     value: `₹${(summary.totalEstimatedCost || 0).toLocaleString('en-IN')}`, icon: '💰' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 border border-white/10 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-white font-semibold text-sm">{s.value}</p>
            <p className="section-label mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// \u2500\u2500 AI Insights Panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AIInsightsPanel({ aiReasoning, summary }) {

  if (!aiReasoning) return null
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border border-saffron-500/20 bg-saffron-500/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-saffron-500/20 flex items-center justify-center">
            <FiZap className="w-5 h-5 text-saffron-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Reasoning</h3>
            <p className="text-slate-500 text-xs">How the AI planned your trip</p>
          </div>
        </div>
        {aiReasoning.routeChoiceSummary && (
          <p className="text-slate-300 text-sm leading-relaxed">{aiReasoning.routeChoiceSummary}</p>
        )}
        {aiReasoning.optimisationInsight && (
          <div className="mt-3 flex items-start gap-2 bg-saffron-500/10 rounded-xl px-3 py-2">
            <FiTarget className="w-4 h-4 text-saffron-400 flex-shrink-0 mt-0.5" />
            <p className="text-saffron-200/80 text-xs leading-relaxed">{aiReasoning.optimisationInsight}</p>
          </div>
        )}
      </div>

      {/* Route leg decisions */}
      {aiReasoning.routeDecisions?.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiNavigation className="w-4 h-4 text-blue-400" /> Route Decisions
          </h4>
          <div className="space-y-3">
            {aiReasoning.routeDecisions.map((dec, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-3 bg-blue-500/3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-white text-sm font-medium">{dec.from}</span>
                  <FiArrowRight className="w-3.5 h-3.5 text-saffron-400 flex-shrink-0" />
                  <span className="text-white text-sm font-medium">{dec.to}</span>
                  {dec.distanceKm > 0 && (
                    <span className="text-slate-500 text-xs ml-auto">~{Math.round(dec.distanceKm)} km</span>
                  )}
                </div>
                {dec.reasoning && (
                  <p className="text-slate-400 text-xs leading-relaxed">{dec.reasoning}</p>
                )}
                {dec.timeSaved && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-emerald-400 text-xs">⏱ Saves {dec.timeSaved}</span>
                    {dec.transportMode && (
                      <span className="text-slate-600 text-xs ml-2">via {dec.transportMode}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Strategy */}
      {aiReasoning.budgetStrategy && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-emerald-400" /> Budget Strategy
          </h4>
          <p className="text-slate-400 text-sm leading-relaxed">{aiReasoning.budgetStrategy}</p>
        </div>
      )}

      {/* Alternatives considered */}
      {aiReasoning.alternativesConsidered?.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiAward className="w-4 h-4 text-purple-400" /> Alternatives Considered & Rejected
          </h4>
          <div className="space-y-2">
            {aiReasoning.alternativesConsidered.map((alt, i) => (
              <div key={i} className="border border-white/8 rounded-xl p-3">
                <p className="text-slate-300 text-sm font-medium mb-0.5">{alt.description}</p>
                <p className="text-red-400/70 text-xs flex items-start gap-1">
                  <FiX className="w-3 h-3 flex-shrink-0 mt-0.5" />{alt.rejectedBecause}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timing advice */}
      {aiReasoning.timingAdvice && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/3">
          <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
            <FiClock className="w-4 h-4" /> Season & Timing Advice
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed">{aiReasoning.timingAdvice}</p>
        </div>
      )}
    </div>
  )
}

// ── City Autocomplete ────────────────────────────────────────────────────────
function CityAutocomplete({ value, onChange, onSelectLocation, placeholder, className }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const skipFetch = useRef(false);

  useEffect(() => { 
    if (value !== query) {
      setQuery(value || '');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch(e) {}
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (s) => {
    const name = s.display_name.split(',')[0];
    skipFetch.current = true;
    setQuery(name);
    onChange(name);
    if (onSelectLocation) {
      onSelectLocation({ name, lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    }
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => { if(suggestions.length > 0) setIsOpen(true) }}
        placeholder={placeholder}
        className={className}
      />
      {loading && <div className="absolute right-3 top-3.5 text-[10px] uppercase font-bold text-saffron-400">Searching...</div>}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div 
              key={idx} 
              onClick={() => handleSelect(s)}
              className="px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-slate-200 border-b border-white/5 last:border-0"
            >
              <div className="font-medium text-white">{s.display_name.split(',')[0]}</div>
              <div className="text-xs text-slate-400 truncate">{s.display_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function TripPlannerPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { tripItems: storeItems } = useTripStore()

  const seedItems = location.state?.tripItems || storeItems

  // ── Form state ──────────────────────────────────────────────────────────────
  const [startLocation, setStartLocation] = useState(
    seedItems.length > 0 ? (seedItems[0]?.city || '') : ''
  )
  const [destinations, setDestinations] = useState(
    seedItems.length > 0 ? seedItems.map(d => d.name) : ['']
  )
  const [startDate,  setStartDate]  = useState('')
  const [days,       setDays]       = useState(5)
  const [travelers,  setTravelers]  = useState(2)
  const [budget,     setBudget]     = useState(15000)
  const [travelType, setTravelType] = useState('friends')
  const [interests,  setInterests]  = useState([])
  const [transport,  setTransport]  = useState('mixed')
  const [pace,       setPace]       = useState('balanced')
  const [hotel,      setHotel]      = useState('standard')
  const [food,       setFood]       = useState('both')
  const [extraReqs,  setExtraReqs]  = useState('')
  const [showExtra,  setShowExtra]  = useState(false)

  const [selectedLocations, setSelectedLocations] = useState({}) // Cache coordinates chosen from dropdown

  const handleLocationSelect = (locObj) => {
    setSelectedLocations(prev => ({ ...prev, [locObj.name]: { lat: locObj.lat, lng: locObj.lng } }))
  }

  // ── Result state ────────────────────────────────────────────────────────────
  const [result,      setResult]      = useState(null)   // MultiItineraryResponse
  const [activeTab,   setActiveTab]   = useState('overview')
  const [loadingStep, setLoadingStep] = useState(0)
  const stepTimer = useRef(null)

  // ── Destination helpers ─────────────────────────────────────────────────────
  const addDestination    = () => setDestinations(d => [...d, ''])
  const removeDestination = (i) => setDestinations(d => d.filter((_, idx) => idx !== i))
  const updateDestination = (i, val) => setDestinations(d => d.map((x, idx) => idx === i ? val : x))
  const moveUp   = (i) => { if (i === 0) return; setDestinations(d => { const n=[...d]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n }) }
  const moveDown = (i) => { if (i === destinations.length - 1) return; setDestinations(d => { const n=[...d]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n }) }

  const toggleInterest = (val) =>
    setInterests(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  // ── Generation ──────────────────────────────────────────────────────────────
  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => generateMultiItinerary({
      startLocation,
      destinations: destinations.filter(Boolean),
      selectedLocations,
      startDate: startDate || undefined,
      days,
      travelers,
      budgetPerPerson: budget,
      travelType,
      interests,
      transport,
      pace,
      hotelPreference: hotel,
      foodPreference: food,
      additionalRequirements: extraReqs || undefined,
    }),
    onSuccess: ({ data }) => {
      clearInterval(stepTimer.current)
      setResult(data)
      setActiveTab('overview')
      toast.success('Itinerary generated! 🗺️')
    },
    onError: (err) => {
      clearInterval(stepTimer.current)
      const msg = err.response?.data?.message || 'Could not generate itinerary. Please try again.'
      toast.error(msg)
    },
  })

  // Animate loading steps
  useEffect(() => {
    if (isPending) {
      setLoadingStep(0)
      stepTimer.current = setInterval(() => {
        setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
      }, 2200)
    }
    return () => clearInterval(stepTimer.current)
  }, [isPending])

  const handleGenerate = () => {
    const valid = destinations.filter(Boolean)
    if (!startLocation.trim()) { toast.error('Please enter a starting location.'); return }
    if (valid.length === 0) { toast.error('Please add at least one destination.'); return }
    const dupes = new Set(valid.map(d => d.toLowerCase()))
    if (dupes.size !== valid.length) { toast.error('Duplicate destinations detected. Please remove duplicates.'); return }
    generate()
  }

  // ── Edit itinerary ──────────────────────────────────────────────────────────
  const removeActivity = (dayNum, slot, idx) => {
    setResult(prev => {
      const days = prev.days.map(d => {
        if (d.day !== dayNum) return d
        return { ...d, [slot]: d[slot].filter((_, i) => i !== idx) }
      })
      return { ...prev, days }
    })
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const { mutate: doSave, isPending: isSaving } = useMutation({
    mutationFn: () => saveItinerary(result),
    onSuccess: () => toast.success('Itinerary saved! ✅'),
    onError: () => toast.error('Could not save. Please try again.'),
  })

  const handleSave = () => {
    if (!isAuthenticated) { toast.error('Please log in to save your itinerary.'); navigate('/login'); return }
    doSave()
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (result?.shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/shared/${result.shareToken}`)
      toast.success('Link copied! 🔗')
    } else {
      toast.error('Save the itinerary first to get a share link.')
    }
  }

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!result) return
    const lines = [`${result.tripSummary?.title || 'My Trip'}\n`]
    result.days.forEach(d => {
      lines.push(`\nDAY ${d.day} — ${d.location} (${d.date || ''})`)
      d.morning?.forEach(a => lines.push(`  [Morning] ${a.time} ${a.name}`))
      d.afternoon?.forEach(a => lines.push(`  [Afternoon] ${a.time} ${a.name}`))
      d.evening?.forEach(a => lines.push(`  [Evening] ${a.time} ${a.name}`))
      if (d.travel?.from) lines.push(`  Travel: ${d.travel.from} → ${d.travel.to} (${d.travel.estimatedTime})`)
      lines.push(`  Est. Cost: ₹${d.estimatedCost}`)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'discover-india-itinerary.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Map locations ───────────────────────────────────────────────────────────
  const mapLocations = result?.mapLocations?.filter(l => l.lat && l.lng) || []
  const mapCenter = mapLocations.length > 0
    ? [mapLocations[0].lat, mapLocations[0].lng]
    : [20.5937, 78.9629]

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-enter min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-saffron-400 text-sm font-semibold uppercase tracking-widest mb-2">AI-Powered</p>
          <h1 className="text-4xl font-bold text-white mb-3">
            Multi-City <span className="gradient-text">Trip Planner</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Add your destinations below — our AI will optimize the route, allocate days, and craft a personalised day-by-day itinerary.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ══ FORM PANEL ══ */}
          <div className="space-y-5">

            {/* Starting Location */}
            <div className="glass-card rounded-2xl p-6 relative z-50">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiNavigation className="text-saffron-400" /> Starting Point
              </h2>
              <CityAutocomplete
                value={startLocation}
                onChange={val => setStartLocation(val)}
                onSelectLocation={handleLocationSelect}
                placeholder="e.g. Hyderabad, Delhi, Mumbai"
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            {/* Destinations */}
            <div className="glass-card rounded-2xl p-6 relative z-40">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FiMapPin className="text-saffron-400" /> Destinations
              </h2>
              <div className="space-y-2">
                {destinations.map((d, i) => (
                  <div key={i} className="flex gap-2 items-center relative" style={{ zIndex: 50 - i }}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(i)} className="reorder-btn" title="Move up">
                        <FiChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveDown(i)} className="reorder-btn" title="Move down">
                        <FiChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-saffron-500/20 text-saffron-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <CityAutocomplete
                      value={d}
                      onChange={val => updateDestination(i, val)}
                      onSelectLocation={handleLocationSelect}
                      placeholder={`Destination ${i + 1} (e.g. Goa, Hampi)`}
                      className="input-field flex-1 px-4 py-2.5 rounded-xl text-sm"
                    />
                    {destinations.length > 1 && (
                      <button onClick={() => removeDestination(i)} className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors">
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addDestination}
                  className="flex items-center gap-2 text-saffron-400 hover:text-saffron-300 text-sm font-medium transition-colors mt-1"
                >
                  <FiPlus className="w-4 h-4" /> Add Destination
                </button>
              </div>
            </div>

            {/* Date & Duration */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FiCalendar className="text-saffron-400" /> Trip Dates
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="section-label block mb-1.5">Start Date (optional)</label>
                  <input
                    type="date" value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input-field w-full px-4 py-2.5 rounded-xl text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Duration</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={1} max={21} value={days}
                      onChange={e => setDays(Number(e.target.value))}
                      className="flex-1 accent-saffron-500"
                    />
                    <div className="text-center min-w-[56px]">
                      <span className="text-2xl font-bold gradient-text">{days}</span>
                      <p className="text-slate-400 text-xs">days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travelers & Budget */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FiUsers className="text-saffron-400" /> Travelers & Budget
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-label block mb-1.5">Travelers</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTravelers(t => Math.max(1, t - 1))}
                      className="w-8 h-8 rounded-lg glass-card border border-white/10 text-slate-300 hover:text-saffron-400 flex items-center justify-center text-lg">−</button>
                    <span className="text-white font-bold text-xl min-w-[24px] text-center">{travelers}</span>
                    <button onClick={() => setTravelers(t => Math.min(20, t + 1))}
                      className="w-8 h-8 rounded-lg glass-card border border-white/10 text-slate-300 hover:text-saffron-400 flex items-center justify-center text-lg">+</button>
                  </div>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Budget / person</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input type="number" value={budget}
                      onChange={e => setBudget(Number(e.target.value))}
                      className="input-field w-full pl-7 pr-3 py-2.5 rounded-xl text-sm"
                      min={1000} step={1000}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Type */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Travel Type</h2>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_TYPES.map(t => (
                  <button key={t.value} onClick={() => setTravelType(t.value)}
                    className={`chip ${travelType === t.value ? 'chip-active' : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(item => (
                  <button key={item.value} onClick={() => toggleInterest(item.value)}
                    className={`chip ${interests.includes(item.value) ? 'chip-active' : ''}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transportation */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Transportation</h2>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setTransport(t.value)}
                    className={`chip ${transport === t.value ? 'chip-active' : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Trip Pace</h2>
              <div className="space-y-2">
                {PACE_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => setPace(p.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all ${
                      pace === p.value ? 'bg-saffron-500/15 border-saffron-500/50 text-white' : 'glass-card border-white/10 text-slate-300 hover:border-white/20'
                    }`}>
                    <span className="text-base">{p.label.split(' ')[0]}</span>
                    <div>
                      <p className="text-sm font-medium">{p.label.split(' ').slice(1).join(' ')}</p>
                      <p className="text-xs text-slate-500">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hotel & Food preference */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-white font-semibold mb-3">Hotel Preference</h2>
                <div className="flex flex-wrap gap-2">
                  {HOTEL_OPTIONS.map(h => (
                    <button key={h.value} onClick={() => setHotel(h.value)}
                      className={`chip ${hotel === h.value ? 'chip-active' : ''}`}>
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-white font-semibold mb-3">Food Preference</h2>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map(f => (
                    <button key={f.value} onClick={() => setFood(f.value)}
                      className={`chip ${food === f.value ? 'chip-active' : ''}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional requirements (collapsible) */}
            <div className="glass-card rounded-2xl p-6">
              <button onClick={() => setShowExtra(e => !e)}
                className="flex items-center justify-between w-full text-white font-semibold">
                Additional Requirements
                {showExtra ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              {showExtra && (
                <textarea
                  value={extraReqs}
                  onChange={e => setExtraReqs(e.target.value)}
                  placeholder="e.g. Wheelchair accessible, traveling with elderly parents, prefer scenic routes..."
                  rows={3}
                  className="input-field w-full px-4 py-2.5 rounded-xl text-sm mt-3 resize-none"
                />
              )}
            </div>

            {/* Generate button */}
            <button
              id="generate-itinerary-btn"
              onClick={handleGenerate}
              disabled={isPending}
              className="btn-glow w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <><FiCpu className="w-5 h-5" /> Generate AI Itinerary</>
              )}
            </button>
          </div>

          {/* ══ RESULTS PANEL ══ */}
          <div className="xl:col-span-2 space-y-5 h-full">
            {isPending ? (
              <LoadingOverlay step={loadingStep} />
            ) : result ? (
              <>
                {/* Action bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Tabs */}
                  <div className="flex gap-1 glass-card rounded-xl p-1 border border-white/10 flex-wrap">
                    {[
                      { key: 'overview', icon: <FiCheckCircle className="w-4 h-4" />, label: 'Overview' },
                      { key: 'plan',     icon: <FiList className="w-4 h-4" />,        label: 'Day Plan' },
                      { key: 'map',      icon: <FiMap className="w-4 h-4" />,         label: 'Map' },
                      { key: 'budget',   icon: <FiDollarSign className="w-4 h-4" />,  label: 'Budget' },
                      { key: 'insights', icon: <FiZap className="w-4 h-4" />,         label: 'AI Insights' },
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          activeTab === tab.key ? 'bg-saffron-500/20 text-saffron-400' : 'text-slate-400 hover:text-white'
                        }`}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button onClick={handleGenerate} disabled={isPending}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-saffron-400 text-sm transition-colors px-3 py-1.5 glass-card rounded-lg border border-white/10 hover:border-saffron-500/30">
                      <FiRefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button onClick={handleDownload}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-saffron-400 text-sm transition-colors">
                      <FiDownload className="w-4 h-4" />
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm transition-colors px-3 py-1.5 glass-card rounded-lg border border-white/10">
                      <FiSave className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={handleShare}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 text-sm transition-colors px-3 py-1.5 glass-card rounded-lg border border-white/10">
                      <FiShare2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                {/* Trip title strip */}
                <div className="glass-card rounded-2xl p-4 border border-saffron-500/20 bg-saffron-500/5">
                  <p className="text-saffron-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Your Trip</p>
                  <h2 className="text-white font-bold text-lg">{result.tripSummary?.title}</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {result.tripSummary?.totalDays} Days · {result.tripSummary?.travelers} Travelers · {result.tripSummary?.pace} pace · {result.tripSummary?.transport}
                  </p>
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === 'overview' && (
                  <OverviewTab summary={result.tripSummary} warnings={result.warnings} />
                )}

                {/* ── Day Plan Tab ── */}
                {activeTab === 'plan' && (
                  <div className="space-y-3">
                    {(result.days || []).map(day => (
                      <DayCard key={day.day} day={day} editable={true}
                        onRemoveActivity={removeActivity} />
                    ))}
                  </div>
                )}

                {/* ── Map Tab ── */}
                {activeTab === 'map' && (
                  <div className="space-y-4">
                    <div className="glass-card rounded-2xl overflow-hidden border border-white/10" style={{ height: '450px' }}>
                      <MapContainer center={mapCenter} zoom={5}
                        style={{ height: '100%', width: '100%', background: '#1e293b' }}>
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {mapLocations.map((loc, i) => (
                          <Marker key={i} position={[loc.lat, loc.lng]}
                            icon={makeNumberedIcon(loc.dayNumber || i + 1, loc.type === 'start' ? '#10b981' : '#ff7a0f')}>
                            <Popup>
                              <div className="text-sm">
                                <strong>{loc.name}</strong>
                                {loc.description && <p className="mt-1 text-gray-600">{loc.description}</p>}
                                {loc.dayNumber > 0 && <p className="text-orange-600 text-xs mt-1">Day {loc.dayNumber}</p>}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        {mapLocations.length >= 2 && <RouteLayer locations={mapLocations} />}
                        {mapLocations.length > 0 && <FitBounds locations={mapLocations} />}
                      </MapContainer>
                    </div>
                    {/* Location list */}
                    <div className="glass-card rounded-2xl p-5 border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <FiNavigation className="text-saffron-400" /> Places on Route
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mapLocations.map((loc, i) => (
                          <div key={i} className="glass-card rounded-xl p-3 border border-white/10 flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                              style={{ background: loc.type === 'start' ? 'rgba(16,185,129,0.2)' : 'rgba(255,122,15,0.2)', color: loc.type === 'start' ? '#10b981' : '#ff9737' }}>
                              {loc.dayNumber || i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">{loc.name}</p>
                              {loc.description && <p className="text-slate-500 text-xs line-clamp-1">{loc.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Budget Tab ── */}
                {activeTab === 'budget' && (
                  <BudgetTab
                    budget={result.budgetBreakdown}
                    travelers={result.tripSummary?.travelers || 1}
                    budgetExplanations={result.aiReasoning?.budgetExplanations}
                  />
                )}

                {/* ── AI Insights Tab ── */}
                {activeTab === 'insights' && (
                  <AIInsightsPanel
                    aiReasoning={result.aiReasoning}
                    summary={result.tripSummary}
                  />
                )}
              </>
            ) : (
              /* Empty state */
              <PreviewMap startLocation={startLocation} destinations={destinations} selectedLocations={selectedLocations} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
