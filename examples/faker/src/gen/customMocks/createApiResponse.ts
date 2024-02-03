import { faker } from '@faker-js/faker'
import type { ApiResponse } from '../models/ApiResponse'

export function createApiResponse(override: Partial<ApiResponse> = {}): NonNullable<ApiResponse> {
  return {
    ...{ 'code': faker.number.float({}), 'type': faker.string.alpha(), 'message': faker.string.alpha() },
    ...override,
  }
}
