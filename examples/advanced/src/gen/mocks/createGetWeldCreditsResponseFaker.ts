import type { GetWeldCreditsResponse } from '../models/ts/GetWeldCreditsResponse.ts'
import { faker } from '@faker-js/faker'

export function createGetWeldCreditsResponseFaker(data?: Partial<GetWeldCreditsResponse>): GetWeldCreditsResponse {
  return {
    ...{ activeWeldCredits: faker.number.float(), consumedWeldCredits: faker.number.float(), totalWeldCredits: faker.number.float() },
    ...(data || {}),
  }
}
