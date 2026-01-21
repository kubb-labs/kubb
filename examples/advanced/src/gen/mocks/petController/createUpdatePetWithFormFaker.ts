import { faker } from '@faker-js/faker'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/ts/petController/UpdatePetWithForm.ts'

export function createUpdatePetWithFormPathParamsFaker(data?: Partial<UpdatePetWithFormPathParams>) {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  } as UpdatePetWithFormPathParams
}

export function createUpdatePetWithFormQueryParamsFaker(data?: Partial<UpdatePetWithFormQueryParams>) {
  return {
    ...{ name: faker.string.alpha(), status: faker.helpers.arrayElement<any>(['working', 'idle']) },
    ...(data || {}),
  } as UpdatePetWithFormQueryParams
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405Faker() {
  return undefined
}

export function createUpdatePetWithFormMutationResponseFaker(_data?: Partial<UpdatePetWithFormMutationResponse>) {
  return undefined as UpdatePetWithFormMutationResponse
}
