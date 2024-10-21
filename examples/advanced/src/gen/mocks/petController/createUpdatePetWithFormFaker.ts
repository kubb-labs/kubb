import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams } from '../../models/ts/petController/UpdatePetWithForm.ts'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParamsFaker(data?: Partial<UpdatePetWithFormPathParams>) {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createUpdatePetWithFormQueryParamsFaker(data?: Partial<UpdatePetWithFormQueryParams>) {
  return {
    ...{ name: faker.string.alpha(), status: faker.helpers.arrayElement(['working', 'idle']) as any },
    ...(data || {}),
  }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405Faker() {
  return undefined
}

export function createUpdatePetWithFormMutationResponseFaker() {
  return undefined
}
