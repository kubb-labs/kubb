import type { ApiResponse } from '../models/ApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createApiResponse(data?: Partial<ApiResponse>): ApiResponse {
  return {
    ...{ code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
