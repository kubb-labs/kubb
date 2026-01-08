import type { DeleteUserStatus4002, DeleteUserStatus4042 } from '../../models/ts/userController/DeleteUser.ts'
import { http } from 'msw'

export function deleteUserHandlerResponse400(data?: DeleteUserStatus4002) {
  return new Response(JSON.stringify(data), {
    status: 400,
  })
}

export function deleteUserHandlerResponse404(data?: DeleteUserStatus4042) {
  return new Response(JSON.stringify(data), {
    status: 404,
  })
}

export function deleteUserHandler(
  data?: string | number | boolean | null | object | ((info: Parameters<Parameters<typeof http.delete>[1]>[0]) => Response | Promise<Response>),
) {
  return http.delete('/user/:username', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
