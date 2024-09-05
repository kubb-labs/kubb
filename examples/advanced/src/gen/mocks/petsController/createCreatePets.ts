import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePets201,
  CreatePetsError,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
} from '../../models/ts/petsController/CreatePets'
import { createPetNotFound } from '../createPetNotFound.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsPathParams(data: NonNullable<Partial<CreatePetsPathParams>> = {}): NonNullable<CreatePetsPathParams> {
  return {
    ...{ uuid: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsQueryParams(data: NonNullable<Partial<CreatePetsQueryParams>> = {}): NonNullable<CreatePetsQueryParams> {
  return {
    ...{ offset: faker.number.int() },
    ...data,
  }
}

export function createCreatePetsHeaderParams(data: NonNullable<Partial<CreatePetsHeaderParams>> = {}): NonNullable<CreatePetsHeaderParams> {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...data,
  }
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

export function createCreatePetsMutationRequest(data: NonNullable<Partial<CreatePetsMutationRequest>> = {}): NonNullable<CreatePetsMutationRequest> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsMutationResponse(): NonNullable<CreatePetsMutationResponse> {
  return undefined
}
