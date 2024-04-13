import { faker } from '@faker-js/faker'
import type {
  CreatePets201,
  CreatePetsError,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../models/ts/petsController/CreatePets'
import { createPetNotFound } from '../createPetNotFound'

export function createCreatePetsPathParams(): NonNullable<CreatePetsPathParams> {
  return { uuid: faker.string.alpha() }
}

export function createCreatePetsQueryParams(): NonNullable<CreatePetsQueryParams> {
  return { offset: faker.number.int() }
}

export function createCreatePetsHeaderParams(): NonNullable<CreatePetsHeaderParams> {
  return { 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) }
}

/**
 * @description Null response
 */
export function createCreatePets201(): NonNullable<CreatePets201> {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(): NonNullable<CreatePetsError> {
  return createPetNotFound()
}

export function createCreatePetsMutationRequest(): NonNullable<CreatePetsMutationRequest> {
  return { name: faker.string.alpha(), tag: faker.string.alpha() }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}
