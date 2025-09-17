import type {
  WeldPacksControllerGetWeldPacks200,
  WeldPacksControllerGetWeldPacksQueryResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerGetWeldPacks200Faker(data?: WeldPacksControllerGetWeldPacks200): WeldPacksControllerGetWeldPacks200 {
  return [...faker.helpers.multiple(() => createWeldPackFaker()), ...(data || [])]
}

export function createWeldPacksControllerGetWeldPacksQueryResponseFaker(
  data?: Partial<WeldPacksControllerGetWeldPacksQueryResponse>,
): WeldPacksControllerGetWeldPacksQueryResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerGetWeldPacks200Faker()])
}
