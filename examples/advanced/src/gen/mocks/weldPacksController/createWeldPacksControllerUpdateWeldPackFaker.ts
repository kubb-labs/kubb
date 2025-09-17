import type {
  WeldPacksControllerUpdateWeldPackPathParams,
  WeldPacksControllerUpdateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import { createUpdateWeldPackDtoFaker } from '../createUpdateWeldPackDtoFaker.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerUpdateWeldPackPathParamsFaker(
  data?: Partial<WeldPacksControllerUpdateWeldPackPathParams>,
): WeldPacksControllerUpdateWeldPackPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createWeldPacksControllerUpdateWeldPack200Faker() {
  return createWeldPackFaker()
}

export function createWeldPacksControllerUpdateWeldPackMutationRequestFaker() {
  return createUpdateWeldPackDtoFaker()
}

export function createWeldPacksControllerUpdateWeldPackMutationResponseFaker(
  data?: Partial<WeldPacksControllerUpdateWeldPackMutationResponse>,
): WeldPacksControllerUpdateWeldPackMutationResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerUpdateWeldPack200Faker()])
}
