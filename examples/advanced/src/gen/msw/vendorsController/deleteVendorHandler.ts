import type { DeleteVendorMutationResponse } from '../../models/ts/vendorsController/DeleteVendor.ts'
import { http } from 'msw'

export function deleteVendorHandlerResponse200(data?: DeleteVendorMutationResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
  })
}

export function deleteVendorHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response | Promise<Response>),
) {
  return http.delete('/v1/vendors/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
