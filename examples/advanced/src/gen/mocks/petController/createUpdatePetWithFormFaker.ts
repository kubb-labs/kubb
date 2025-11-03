import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
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
export function createUpdatePetWithForm405Faker() {
  return undefined
}

export function createUpdatePetWithFormMutationResponseFaker(_data?: Partial<UpdatePetWithFormMutationResponse>): UpdatePetWithFormMutationResponse {
  return undefined
}
