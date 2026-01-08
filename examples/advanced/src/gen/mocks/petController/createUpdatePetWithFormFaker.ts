import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithFormResponseData,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

export function createUpdatePetWithFormPathParamsFaker(data?: Partial<UpdatePetWithFormPathParams>): UpdatePetWithFormPathParams {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createUpdatePetWithFormQueryParamsFaker(data?: Partial<UpdatePetWithFormQueryParams>): UpdatePetWithFormQueryParams {
  return {
    ...{ name: faker.string.alpha(), status: faker.helpers.arrayElement<any>(['working', 'idle']) },
    ...(data || {}),
  }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithFormStatus405Faker() {
  return undefined
}

export function createUpdatePetWithFormResponseDataFaker(_data?: Partial<UpdatePetWithFormResponseData>): UpdatePetWithFormResponseData {
  return undefined
}
