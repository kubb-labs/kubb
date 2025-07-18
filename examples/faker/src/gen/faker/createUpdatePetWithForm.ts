/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithFormMutationResponse } from '../models/UpdatePetWithForm.ts'
import { faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathParams(data?: Partial<UpdatePetWithFormPathParams>): UpdatePetWithFormPathParams {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createUpdatePetWithFormQueryParams(data?: Partial<UpdatePetWithFormQueryParams>): UpdatePetWithFormQueryParams {
  return {
    ...{ name: faker.string.alpha(), status: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithForm405() {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(_data?: Partial<UpdatePetWithFormMutationResponse>): UpdatePetWithFormMutationResponse {
  return undefined
}
