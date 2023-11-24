import { faker } from '@faker-js/faker'
import { createPetNotFound } from '../createPetNotFound'
import type {
  CreatePets201,
  CreatePetsError,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../models/ts/petsController/CreatePets'

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
  return { 'name': faker.string.alpha(), 'tag': faker.string.alpha() }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}

export function createCreatePetsPathParams(): NonNullable<CreatePetsPathParams> {
  return { 'uuid': faker.string.alpha() }
}

export function createCreatePetsQueryParams(): NonNullable<CreatePetsQueryParams> {
  return { 'offset': faker.number.float({}) }
}
/**
 * @description unexpected error
 */

export function createCreatePetsError(): NonNullable<CreatePetsError> {
  return createPetNotFound()
}
