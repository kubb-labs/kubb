import type { AppControllerGetStatusQueryResponse } from '../../models/ts/appController/AppControllerGetStatus.ts'
import { http } from 'msw'

export function appControllerGetStatusHandler(
  data?: AppControllerGetStatusQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response),
) {
  return http.get('/api/status', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
    })
  })
}
