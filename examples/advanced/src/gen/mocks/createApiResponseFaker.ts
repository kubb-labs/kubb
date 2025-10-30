import { faker } from '@faker-js/faker'
import type { ApiResponse } from '../models/ts/ApiResponse.ts'

export function createApiResponseFaker(data?: Partial<ApiResponse>): ApiResponse {
  return {
    ...{ code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() },
    ...(data || {}),
  }
}
