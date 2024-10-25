import type { OptionsFindPetsByStatusMutationResponse } from '../../../models/OptionsFindPetsByStatus.ts'
import { http } from 'msw'

export function optionsFindPetsByStatusHandler(data?: OptionsFindPetsByStatusMutationResponse) {
  return http.options('*/pet/findByStatus', function handler(info) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
