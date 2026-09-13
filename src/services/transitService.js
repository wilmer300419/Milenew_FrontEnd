import api from './api'

// Contrato propuesto para el equipo de BackEnd (ver docs/README · Contract Between Teams).
// Ninguno de estos endpoints existe todavía: la UI que los consume debe manejar el
// loading/error de useFetch en vez de asumir que la respuesta llega.

export const getStations = () => api.get('/transit/stations')

export const getRouteStatus = (routeId) => api.get(`/transit/routes/${routeId}/status`)

export const getWallet = () => api.get('/wallet')

export const rechargeWallet = (amount) => api.post('/wallet/recharge', { amount })

export const getNotifications = () => api.get('/notifications')

export const planTripRequest = (fromId, toId) =>
  api.get('/transit/trip-plan', { params: { from: fromId, to: toId } })

export const getTelemetry = (vehicleId) => api.get(`/transit/vehicles/${vehicleId}/telemetry`)

export const postIncident = (payload) => api.post('/transit/incidents', payload)

export const getChecklist = () => api.get('/transit/checklist')

export const postChecklistItem = (itemId, done) =>
  api.post('/transit/checklist', { itemId, done })

export const getChatMessages = () => api.get('/transit/operations-chat')

export const postChatMessage = (message) => api.post('/transit/operations-chat', { message })
