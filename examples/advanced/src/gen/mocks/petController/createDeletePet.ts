import { faker } from '@faker-js/faker'

import { DeletePet400 } from '../../models/ts/petController/DeletePet'
import { DeletePetHeaderParams } from '../../models/ts/petController/DeletePet'
import { DeletePetMutationResponse } from '../../models/ts/petController/DeletePet'
import { DeletePetPathParams } from '../../models/ts/petController/DeletePet'

/**
 * @description Invalid pet value
 */

export function createDeletePet400(): DeletePet400 {
  return undefined
}

export function createDeletePetHeaderParams(): DeletePetHeaderParams {
  return { api_key: faker.string.alpha() }
}

export function createDeletePetMutationResponse(): DeletePetMutationResponse {
  return undefined
}

export function createDeletePetPathParams(): DeletePetPathParams {
  return { petId: faker.number.float({}) }
}
