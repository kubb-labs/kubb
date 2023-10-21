import { faker } from '@faker-js/faker'

import { DeletePet400 } from '../../models/ts/petController/DeletePet'
import { DeletePetHeaderParams } from '../../models/ts/petController/DeletePet'
import { DeletePetMutationResponse } from '../../models/ts/petController/DeletePet'
import { DeletePetPathParams } from '../../models/ts/petController/DeletePet'

/**
 * @description Invalid pet value
 */

export function createDeletePet400(): NonNullable<DeletePet400> {
  return undefined
}

export function createDeletePetHeaderParams(): NonNullable<DeletePetHeaderParams> {
  return { 'api_key': faker.string.alpha() }
}

export function createDeletePetMutationResponse(): NonNullable<DeletePetMutationResponse> {
  return undefined
}

export function createDeletePetPathParams(): NonNullable<DeletePetPathParams> {
  return { 'petId': faker.number.float({}) }
}
