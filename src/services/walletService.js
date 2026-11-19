import api from './api'

export const getWallet = () => api.get('/wallet')

export const rechargeWallet = (amount) => api.post('/wallet/recharge', { amount })

export const getTransactions = () => api.get('/wallet/transactions')
