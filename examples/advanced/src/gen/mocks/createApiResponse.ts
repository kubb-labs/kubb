import { faker } from '@faker-js/faker'

import type { ApiResponse } from '../models/ts/ApiResponse'

export function createApiResponse(): ApiResponse {
  return { code: faker.number.float({}), type: faker.string.alpha(), message: faker.string.alpha() }
}
