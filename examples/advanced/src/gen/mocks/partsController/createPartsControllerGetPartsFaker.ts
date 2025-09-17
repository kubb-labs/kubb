import type { PartsControllerGetParts200, PartsControllerGetPartsQueryResponse } from '../../models/ts/partsController/PartsControllerGetParts.ts'
import { createPartFaker } from '../createPartFaker.ts'
import { faker } from '@faker-js/faker'

export function createPartsControllerGetParts200Faker(data?: PartsControllerGetParts200): PartsControllerGetParts200 {
  return [...faker.helpers.multiple(() => createPartFaker()), ...(data || [])]
}

export function createPartsControllerGetPartsQueryResponseFaker(data?: Partial<PartsControllerGetPartsQueryResponse>): PartsControllerGetPartsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createPartsControllerGetParts200Faker()])
}
