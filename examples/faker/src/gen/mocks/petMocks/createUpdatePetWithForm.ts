import { faker } from '@faker-js/faker'

import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../models/UpdatePetWithForm'

/**
 * @description Invalid input
 */

export function createUpdatePetWithForm405(): UpdatePetWithForm405 {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(): UpdatePetWithFormMutationResponse {
  return undefined
}

export function createUpdatePetWithFormPathParams(): UpdatePetWithFormPathParams {
  return { petId: faker.number.float({}) }
}

export function createUpdatePetWithFormQueryParams(): UpdatePetWithFormQueryParams {
  return { name: faker.string.alpha(), status: faker.string.alpha() }
}
