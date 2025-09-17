import type {
  WeldPacksControllerDeleteWeldPackPathParams,
  WeldPacksControllerDeleteWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerDeleteWeldPackPathParamsFaker(
  data?: Partial<WeldPacksControllerDeleteWeldPackPathParams>,
): WeldPacksControllerDeleteWeldPackPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createWeldPacksControllerDeleteWeldPack200Faker() {
  return faker.datatype.boolean()
}

export function createWeldPacksControllerDeleteWeldPackMutationResponseFaker(
  data?: Partial<WeldPacksControllerDeleteWeldPackMutationResponse>,
): WeldPacksControllerDeleteWeldPackMutationResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerDeleteWeldPack200Faker()])
}
