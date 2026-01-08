import { http } from 'msw'
import type { GetUserByNameResponseData, GetUserByNameStatus400, GetUserByNameStatus404 } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByNameHandlerResponse200(data: GetUserByNameResponseData) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getUserByNameHandlerResponse400(data?: GetUserByNameStatus400) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getUserByNameHandlerResponse404(data?: GetUserByNameStatus404) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function getUserByNameHandler(
  data?: GetUserByNameResponseData | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
) {
  return http.get('/user/:username', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
