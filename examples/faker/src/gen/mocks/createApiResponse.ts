import { ApiResponse } from '../models/ApiResponse'
import { faker } from '@faker-js/faker'

export function createApiResponse(): NonNullable<ApiResponse> {
  return { code: faker.number.float({}), type: faker.string.alpha(), message: faker.string.alpha() }
}
