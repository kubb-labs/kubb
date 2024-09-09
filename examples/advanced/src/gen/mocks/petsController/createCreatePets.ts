import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFound } from '../createPetNotFound.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsPathParams(data: NonNullable<Partial<CreatePetsPathParams>> = {}) {
  return {
    ...{ uuid: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsQueryParams(data: NonNullable<Partial<CreatePetsQueryParams>> = {}) {
  return {
    ...{ offset: faker.number.int() },
    ...data,
  }
}

export function createCreatePetsHeaderParams(data: NonNullable<Partial<CreatePetsHeaderParams>> = {}) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...data,
  }
}

/**
 * @description Null response
 */
export function createCreatePets201() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsError() {
  return createPetNotFound()
}

export function createCreatePetsMutationRequest(data: NonNullable<Partial<CreatePetsMutationRequest>> = {}) {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsMutationResponse() {
  return undefined
}
