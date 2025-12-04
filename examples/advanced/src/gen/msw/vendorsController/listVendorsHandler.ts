import { http } from 'msw'
import type { ListVendors400, ListVendors401, ListVendors403, ListVendorsQueryResponse } from '../../models/ts/vendorsController/ListVendors.ts'

export function listVendorsHandlerResponse200(data: ListVendorsQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function listVendorsHandlerResponse400(data?: ListVendors400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function listVendorsHandlerResponse401(data?: ListVendors401) {
  return new Response(JSON.stringify(data), {
    status: 401,
  })
}

export function listVendorsHandlerResponse403(data?: ListVendors403) {
  return new Response(JSON.stringify(data), {
    status: 403,
  })
}

export function listVendorsHandler(data?: ListVendorsQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>)) {
  return http.get('/v1/vendors', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
