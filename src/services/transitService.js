import api from './api'

export const ROUTE_ID = 'caracas-b75'

export const getRoutes = () => api.get('/transit/routes')

export const getStations = (routeId = ROUTE_ID) => api.get('/transit/stations', { params: { route: routeId } })

export const getRouteVehicles = (routeId = ROUTE_ID) => api.get(`/transit/routes/${routeId}/vehicles`)

export const getStationArrivals = (stationId, routeId = ROUTE_ID) =>
  api.get(`/transit/stations/${stationId}/arrivals`, { params: { route: routeId } })

export const planTrip = (fromId, toId, routeId = ROUTE_ID) =>
  api.get('/transit/trip-plan', { params: { from: fromId, to: toId, route: routeId } })

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

// ---- Turno, novedades/SOS y avisos del operador
export const getShift = () => api.get('/transit/shift')

export const startShift = () => api.post('/transit/shift/start')

export const setShiftBreak = (active) => api.post('/transit/shift/break', { active })

export const endShift = () => api.post('/transit/shift/end')

export const getDriverReports = () => api.get('/transit/driver-reports')

export const postDriverReport = (payload) => api.post('/transit/driver-reports', payload)

export const getDriverNotices = () => api.get('/transit/driver-notices')

export const ackDriverNotice = (id) => api.post(`/transit/driver-notices/${id}/ack`)
