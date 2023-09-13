import { faker } from '@faker-js/faker'

import { UpdatePetWithForm405 } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormPathParams } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormQueryParams } from '../../models/ts/petController/UpdatePetWithForm'

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
