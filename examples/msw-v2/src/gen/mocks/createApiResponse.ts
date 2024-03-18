import { faker } from '@faker-js/faker'
import type { ApiResponse } from '../models/ApiResponse'

export function createApiResponse(override: NonNullable<Partial<ApiResponse>> = {}): NonNullable<ApiResponse> {
  faker.seed([220])
  return {
    ...{ 'code': faker.number.int(), 'type': faker.string.alpha(), 'message': faker.string.alpha() },
    ...override,
  }
}
