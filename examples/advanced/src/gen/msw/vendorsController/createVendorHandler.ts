import { http } from 'msw'
import type { CreateVendorMutationResponse } from '../../models/ts/vendorsController/CreateVendor.ts'

export function createVendorHandlerResponse200(data: CreateVendorMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function createVendorHandler(
  data?: CreateVendorMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response | Promise<Response>),
) {
  return http.post('/v1/vendors', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
