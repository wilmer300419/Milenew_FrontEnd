import api from './api'

export const getTrips = () => api.get('/trips')

/** Paga el pasaje con la TuLlave y registra el viaje (cierra el anterior si seguía abierto). */
export const startTrip = (fromStationId, toStationId, routeId) => api.post('/trips', { fromStationId, toStationId, routeId })

/** Viaje en curso o data: null. */
export const getActiveTrip = () => api.get('/trips/active')

export const finishTrip = (tripId) => api.post(`/trips/${tripId}/finish`)
