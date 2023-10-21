import { faker } from '@faker-js/faker'

import { UpdatePetWithForm405 } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormMutationResponse } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormPathParams } from '../../models/ts/petController/UpdatePetWithForm'
import { UpdatePetWithFormQueryParams } from '../../models/ts/petController/UpdatePetWithForm'

/**
 * @description Invalid input
 */

export function createUpdatePetWithForm405(): NonNullable<UpdatePetWithForm405> {
  return undefined
}

export function createUpdatePetWithFormMutationResponse(): NonNullable<UpdatePetWithFormMutationResponse> {
  return undefined
}

export function createUpdatePetWithFormPathParams(): NonNullable<UpdatePetWithFormPathParams> {
  return { 'petId': faker.number.float({}) }
}

export function createUpdatePetWithFormQueryParams(): NonNullable<UpdatePetWithFormQueryParams> {
  return { 'name': faker.string.alpha(), 'status': faker.string.alpha() }
}
