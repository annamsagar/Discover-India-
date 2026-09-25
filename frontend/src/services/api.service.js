import api from '../lib/api'

export const destinationApi = {
  getAll: (params) => api.get('/destinations', { params }),
  getById: (id) => api.get(`/destinations/${id}`),
  search: (query, params) => api.get('/destinations/search', { params: { query, ...params } }),
  getByState: (state, params) => api.get(`/destinations/state/${state}`, { params }),
  getTopRated: (limit = 6) => api.get('/destinations/top-rated', { params: { limit } }),
  create: (data) => api.post('/destinations', data),
  update: (id, data) => api.put(`/destinations/${id}`, data),
  delete: (id) => api.delete(`/destinations/${id}`),
}

export const reviewApi = {
  getByDestination: (destinationId, params) =>
    api.get(`/destinations/${destinationId}/reviews`, { params }),
  create: (destinationId, data) =>
    api.post(`/destinations/${destinationId}/reviews`, data),
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
}

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/users/me'),
}
