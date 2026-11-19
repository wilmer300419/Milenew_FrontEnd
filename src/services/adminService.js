import api from './api'

// Central de operaciones (solo rol admin). El FrontEnd solo habla con /api.
export const getSummary = () => api.get('/admin/summary')

export const getIncidents = (status) => api.get('/admin/incidents', { params: status ? { status } : {} })

export const updateIncident = (id, status, note) => api.patch(`/admin/incidents/${id}`, { status, note })

export const getConversations = () => api.get('/admin/conversations')

export const getConversation = (driverId) => api.get(`/admin/conversations/${driverId}`)

export const replyToDriver = (driverId, message) => api.post(`/admin/conversations/${driverId}`, { message })

export const getFleet = () => api.get('/admin/fleet')

export const assignDriver = (vehicleCode, driverId) => api.put(`/admin/fleet/${vehicleCode}/driver`, { driverId })

export const getNotices = () => api.get('/admin/notices')

export const createNotice = (title, description) => api.post('/admin/notices', { title, description })

export const deleteNotice = (id) => api.delete(`/admin/notices/${id}`)
