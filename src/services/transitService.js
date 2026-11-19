import api from './api'

export const ROUTE_ID = 'caracas-b75'

export const getStations = () => api.get('/transit/stations')

export const getRouteVehicles = (routeId = ROUTE_ID) => api.get(`/transit/routes/${routeId}/vehicles`)

export const getStationArrivals = (stationId) => api.get(`/transit/stations/${stationId}/arrivals`)

export const planTrip = (fromId, toId) => api.get('/transit/trip-plan', { params: { from: fromId, to: toId } })

export const getIncidentCategories = () => api.get('/transit/incident-categories')

export const postIncident = (payload) => api.post('/transit/incidents', payload)

export const getNotifications = () => api.get('/notifications')

// ---- Operador (rol driver)
export const getMyVehicle = () => api.get('/transit/my-vehicle')

export const getChecklist = () => api.get('/transit/checklist')

export const postChecklistItem = (itemId, done) => api.post('/transit/checklist', { itemId, done })

export const getChatMessages = () => api.get('/transit/operations-chat')

export const postChatMessage = (message) => api.post('/transit/operations-chat', { message })

export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`)

export const markAllNotificationsRead = () => api.post('/notifications/read-all')
