import type { GetUserByNameResponseData2, GetUserByNameStatus4002, GetUserByNameStatus4042 } from '../../models/ts/userController/GetUserByName.ts'
import { http } from 'msw'

export function getUserByNameHandlerResponse200(data: GetUserByNameResponseData2) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function getUserByNameHandlerResponse400(data?: GetUserByNameStatus4002) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function getUserByNameHandlerResponse404(data?: GetUserByNameStatus4042) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function getUserByNameHandler(
  data?: GetUserByNameResponseData2 | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response | Promise<Response>),
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
