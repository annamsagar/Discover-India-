import { Link } from 'react-router-dom'
import { FiMapPin, FiStar, FiPlus, FiCheck, FiBook, FiNavigation } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useTripStore } from '../store/tripStore'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty'}`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-400">{rating?.toFixed(1)}</span>
    </div>
  )
}

export default function DestinationCard({ destination }) {
  const { id, name, state, city, imageUrl, categories, averageRating, reviewCount, entryFee, distanceKm } = destination
  const { addToTrip, removeFromTrip, isInTrip } = useTripStore()
  const inTrip = isInTrip(id)

  const handleAddToTrip = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (inTrip) {
      removeFromTrip(id)
      toast.success(`${name} removed from trip`)
    } else {
      addToTrip(destination)
      toast.success(`${name} added to trip! 🗺️`)
    }
  }

  const handleWikipedia = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const query = encodeURIComponent(`${name} ${state} India`)
    window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${query}`, '_blank', 'noopener')
  }

  return (
    <Link to={`/destinations/${id}`} className="block group">
      <div className="destination-card glass-card rounded-2xl overflow-hidden cursor-pointer relative">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={imageUrl || 'https://via.placeholder.com/400x250?text=Discover+India'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />

          {/* Distance from current location badge */}
          {distanceKm != null && !isNaN(distanceKm) && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30 z-10 shadow-lg">
              <FiNavigation className="w-3 h-3 text-emerald-400" />
              <span>{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${Math.round(distanceKm)} km`} away</span>
            </div>
          )}

          {/* Entry fee badge */}
          <div className="absolute top-3 right-3 z-10">
            {entryFee === 0 ? (
              <span className="badge badge-emerald">Free Entry</span>
            ) : (
              <span className="badge badge-saffron">₹{entryFee?.toLocaleString()}</span>
            )}
          </div>

          {/* Rating overlay */}
          <div className="absolute bottom-3 left-3">
            <StarRating rating={averageRating} />
          </div>

          {/* Action buttons — appear on hover */}
          <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            {/* Add to Trip button */}
            <button
              onClick={handleAddToTrip}
              title={inTrip ? 'Remove from Trip' : 'Add to Trip'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-sm transition-all ${
                inTrip
                  ? 'bg-saffron-500 text-white'
                  : 'bg-black/60 text-white hover:bg-saffron-500'
              }`}
            >
              {inTrip ? <FiCheck className="w-3.5 h-3.5" /> : <FiPlus className="w-3.5 h-3.5" />}
              {inTrip ? 'In Trip' : 'Add Trip'}
            </button>

            {/* Wikipedia button */}
            <button
              onClick={handleWikipedia}
              title="View on Wikipedia"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black/60 text-white hover:bg-blue-600 shadow-lg backdrop-blur-sm transition-all"
            >
              <FiBook className="w-3.5 h-3.5" /> History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-base mb-1 group-hover:text-saffron-400 transition-colors line-clamp-1">
            {name}
          </h3>

          <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
            <FiMapPin className="w-3 h-3 text-saffron-500 flex-shrink-0" />
            <span>{city ? `${city}, ` : ''}{state}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories?.slice(0, 3).map((cat) => (
              <span key={cat} className="badge badge-saffron">{cat}</span>
            ))}
          </div>

          {reviewCount > 0 && (
            <p className="text-slate-500 text-xs mt-2">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* In-trip indicator strip */}
        {inTrip && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-saffron-400 to-saffron-600" />
        )}
      </div>
    </Link>
  )
}
