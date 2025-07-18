/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { GetInventoryQueryResponse } from '../../../models/GetInventory.ts'
import { http } from 'msw'

export function getInventoryHandler(data?: GetInventoryQueryResponse | ((info: Parameters<Parameters<typeof http.get>[1]>[0]) => Response)) {
  return http.get('http://localhost:3000/store/inventory', function handler(info) {
    if (typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
