import { faker } from '@faker-js/faker'
import type { ApiResponse } from '../models/ts/ApiResponse'

export function createApiResponse(data: NonNullable<Partial<ApiResponse>> = {}): NonNullable<ApiResponse> {
  return {
    ...{ code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() },
    ...data,
  }
}
