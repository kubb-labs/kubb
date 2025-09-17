import type { WeldPacksControllerCreateWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import { createCreateWeldPackDtoFaker } from '../createCreateWeldPackDtoFaker.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerCreateWeldPack201Faker() {
  return createWeldPackFaker()
}

export function createWeldPacksControllerCreateWeldPackMutationRequestFaker() {
  return createCreateWeldPackDtoFaker()
}

export function createWeldPacksControllerCreateWeldPackMutationResponseFaker(
  data?: Partial<WeldPacksControllerCreateWeldPackMutationResponse>,
): WeldPacksControllerCreateWeldPackMutationResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerCreateWeldPack201Faker()])
}
