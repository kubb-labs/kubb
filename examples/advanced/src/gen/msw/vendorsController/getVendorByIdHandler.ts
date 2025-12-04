import { http } from 'msw'
import type {
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
  GetVendorByIdQueryResponse,
} from '../../models/ts/vendorsController/GetVendorById.ts'

export function getVendorByIdHandlerResponse200(data: GetVendorByIdQueryResponse) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getVendorByIdHandlerResponse400(data?: GetVendorById400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getVendorByIdHandlerResponse401(data?: GetVendorById401) {
  return new Response(JSON.stringify(data), {
    status: 401,
  })
}

export function getVendorByIdHandlerResponse403(data?: GetVendorById403) {
  return new Response(JSON.stringify(data), {
    status: 403,
  })
}

export function getVendorByIdHandlerResponse500(data?: GetVendorById500) {
  return new Response(JSON.stringify(data), {
    status: 500,
  })
}

export function getVendorByIdHandler(
  data?: GetVendorByIdQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/v1/vendors/:id', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
