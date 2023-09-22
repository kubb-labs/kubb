import { faker } from '@faker-js/faker'

import { ApiResponse } from '../models/ts/ApiResponse'

export function createApiresponse(): ApiResponse {
  return { code: faker.number.float({}), type: faker.string.alpha(), message: faker.string.alpha() }
}
