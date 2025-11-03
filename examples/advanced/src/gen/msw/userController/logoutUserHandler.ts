import { http } from "msw";

export function logoutUserHandler(data?: string | number | boolean | null | object | ((
        info: Parameters<Parameters<typeof http.get>[1]>[0],
      ) => Response | Promise<Response>)) {
  return http.get('/user/logout', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    
    })
  })
}