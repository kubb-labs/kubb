import { makeApi, Zodios } from '@zodios/core'

const endpoints = makeApi([])

export const api = new Zodios(endpoints)

export default api
