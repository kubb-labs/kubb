import type {
  WeldPacksControllerActivateWeldPackPathParams,
  WeldPacksControllerActivateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import { createActivateWeldPackDtoFaker } from '../createActivateWeldPackDtoFaker.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerActivateWeldPackPathParamsFaker(
  data?: Partial<WeldPacksControllerActivateWeldPackPathParams>,
): WeldPacksControllerActivateWeldPackPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createWeldPacksControllerActivateWeldPack200Faker() {
  return createWeldPackFaker()
}

export function createWeldPacksControllerActivateWeldPackMutationRequestFaker() {
  return createActivateWeldPackDtoFaker()
}

export function createWeldPacksControllerActivateWeldPackMutationResponseFaker(
  data?: Partial<WeldPacksControllerActivateWeldPackMutationResponse>,
): WeldPacksControllerActivateWeldPackMutationResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerActivateWeldPack200Faker()])
}
