import type { UpdateVendorMutationResponse } from '../../models/ts/vendorsController/UpdateVendor.ts'
import { http } from 'msw'

export function updateVendorHandlerResponse200(data: UpdateVendorMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function updateVendorHandler(
  data?: UpdateVendorMutationResponse | ((info: Parameters<Parameters<typeof http.put>[1]>[0]) => Response | Promise<Response>),
) {
  return http.put('/v1/vendors/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
