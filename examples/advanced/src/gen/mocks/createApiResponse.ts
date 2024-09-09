import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createApiResponse(data: NonNullable<Partial<ApiResponse>> = {}) {
  return {
    ...{ code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() },
    ...data,
  }
}
