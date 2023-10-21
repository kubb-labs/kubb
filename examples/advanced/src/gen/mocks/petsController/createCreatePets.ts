import { faker } from '@faker-js/faker'

import { CreatePets201 } from '../../models/ts/petsController/CreatePets'
import { CreatePetsHeaderParams } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationRequest } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets'
import { CreatePetsPathParams } from '../../models/ts/petsController/CreatePets'
import { CreatePetsQueryParams } from '../../models/ts/petsController/CreatePets'
import { CreatePetsError } from '../../models/ts/petsController/CreatePets'
import { createPetNotFound } from '../createPetNotFound'

/**
 * @description Null response
 */

export function createCreatePets201(): NonNullable<CreatePets201> {
  return undefined
}

export function createCreatePetsHeaderParams(): NonNullable<CreatePetsHeaderParams> {
  return { 'X-EXAMPLE': faker.helpers.arrayElement<any>([`ONE`, `TWO`, `THREE`]) }
}

export function createCreatePetsMutationRequest(): NonNullable<CreatePetsMutationRequest> {
  return { name: faker.string.alpha(), tag: faker.string.alpha() }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}

export function createCreatePetsPathParams(): NonNullable<CreatePetsPathParams> {
  return { uuid: faker.string.alpha() }
}

export function createCreatePetsQueryParams(): NonNullable<CreatePetsQueryParams> {
  return { offset: faker.number.float({}) }
}

/**
 * @description unexpected error
 */

export function createCreatePetsError(): NonNullable<CreatePetsError> {
  return createPetNotFound()
}
