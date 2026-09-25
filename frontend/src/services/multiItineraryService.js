import api from '../lib/api'

/** Generate a full multi-point AI itinerary */
export const generateMultiItinerary = (payload) =>
  api.post('/chatbot/multi-itinerary', payload)

/** Save a generated itinerary (auth required) */
export const saveItinerary = (itineraryData) =>
  api.post('/itinerary', itineraryData)

/** Get all saved trips for the current user */
export const getMyTrips = () =>
  api.get('/itinerary/my-trips')

/** Get a single saved itinerary by ID */
export const getItinerary = (id) =>
  api.get(`/itinerary/${id}`)

/** Update an existing saved itinerary */
export const updateItinerary = (id, data) =>
  api.put(`/itinerary/${id}`, data)

/** Delete a saved itinerary */
export const deleteItinerary = (id) =>
  api.delete(`/itinerary/${id}`)

/** Generate a public share link for an itinerary */
export const shareItinerary = (id) =>
  api.post(`/itinerary/${id}/share`)

/** Get a publicly shared itinerary by token (no auth) */
export const getSharedItinerary = (token) =>
  api.get(`/itinerary/share/${token}`)
