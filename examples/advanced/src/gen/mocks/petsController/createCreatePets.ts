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

export function createCreatePetsPathParams(override: NonNullable<Partial<CreatePetsPathParams>> = {}): NonNullable<CreatePetsPathParams> {
  return {
    ...{ uuid: faker.string.alpha() },
    ...override,
  }
}

export function createCreatePetsQueryParams(override: NonNullable<Partial<CreatePetsQueryParams>> = {}): NonNullable<CreatePetsQueryParams> {
  return {
    ...{ offset: faker.number.int() },
    ...override,
  }
}

export function createCreatePetsHeaderParams(override: NonNullable<Partial<CreatePetsHeaderParams>> = {}): NonNullable<CreatePetsHeaderParams> {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...override,
  }
}

/**
 * @description Null response
 */
export function createCreatePets201(override?: NonNullable<Partial<CreatePets201>>): NonNullable<CreatePets201> {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(override?: NonNullable<Partial<CreatePetsError>>): NonNullable<CreatePetsError> {
  return createPetNotFound(override)
}

export function createCreatePetsMutationRequest(override: NonNullable<Partial<CreatePetsMutationRequest>> = {}): NonNullable<CreatePetsMutationRequest> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...override,
  }
}

export function createCreatePetsMutationResponse(override?: NonNullable<Partial<CreatePetsMutationResponse>>): NonNullable<CreatePetsMutationResponse> {
  return undefined
}
