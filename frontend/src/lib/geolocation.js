/**
 * Geolocation utility for retrieving and reverse-geocoding user's current GPS position.
 */

export async function getCurrentPositionCoordinates(options = {}) {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => {
        let msg = 'Unable to retrieve location.'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser.'
            break
          case err.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable.'
            break
          case err.TIMEOUT:
            msg = 'Location request timed out. Please try again.'
            break
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options,
      }
    )
  })
}

/**
 * Reverse geocodes lat & lng into an Indian city/locality name via OpenStreetMap Nominatim.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )
    if (!res.ok) throw new Error('Reverse geocoding failed')
    const data = await res.json()
    const addr = data.address || {}

    const cityName =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.city_district ||
      addr.state_district ||
      addr.county ||
      'Current Location'

    const stateName = addr.state || ''
    const formatted = stateName && cityName !== stateName ? `${cityName}, ${stateName}` : cityName

    return {
      lat,
      lng,
      cityName,
      stateName,
      displayName: formatted,
      fullAddress: data.display_name || formatted,
    }
  } catch (error) {
    return {
      lat,
      lng,
      cityName: 'Current Location',
      stateName: '',
      displayName: `Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      fullAddress: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    }
  }
}

/**
 * Convenience method to get coordinates and reverse geocode in one go.
 */
export async function getCurrentUserLocation() {
  const coords = await getCurrentPositionCoordinates()
  const geoDetails = await reverseGeocode(coords.lat, coords.lng)
  return {
    ...coords,
    ...geoDetails,
  }
}

/**
 * Calculate Haversine distance in kilometres between two coordinate pairs.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistanceKm(km) {
  if (km == null || isNaN(km)) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
