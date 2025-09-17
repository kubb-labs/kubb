import type {
  WeldPacksControllerGetWeldPackPathParams,
  WeldPacksControllerGetWeldPackQueryResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerGetWeldPackPathParamsFaker(
  data?: Partial<WeldPacksControllerGetWeldPackPathParams>,
): WeldPacksControllerGetWeldPackPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createWeldPacksControllerGetWeldPack200Faker() {
  return createWeldPackFaker()
}

export function createWeldPacksControllerGetWeldPackQueryResponseFaker(
  data?: Partial<WeldPacksControllerGetWeldPackQueryResponse>,
): WeldPacksControllerGetWeldPackQueryResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerGetWeldPack200Faker()])
}
