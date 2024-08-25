import type { ApiResponse } from '../models/ApiResponse'
import { faker } from '@faker-js/faker'

export function createApiResponse(data: NonNullable<Partial<ApiResponse>> = {}): NonNullable<ApiResponse> {
  faker.seed([220])
  return {
    ...{ code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() },
    ...data,
  }
}
