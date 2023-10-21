import { faker } from '@faker-js/faker'

import { UpdatePetWithForm405 } from '../../models/UpdatePetWithForm'
import { UpdatePetWithFormMutationResponse } from '../../models/UpdatePetWithForm'
import { UpdatePetWithFormPathParams } from '../../models/UpdatePetWithForm'
import { UpdatePetWithFormQueryParams } from '../../models/UpdatePetWithForm'

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
