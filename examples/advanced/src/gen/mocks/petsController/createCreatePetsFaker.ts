import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsPathParamsFaker(data: NonNullable<Partial<CreatePetsPathParams>> = {}) {
  return {
    ...{ uuid: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsQueryParamsFaker(data: NonNullable<Partial<CreatePetsQueryParams>> = {}) {
  return {
    ...{ offset: faker.number.int() },
    ...data,
  }
}

export function createCreatePetsHeaderParamsFaker(data: NonNullable<Partial<CreatePetsHeaderParams>> = {}) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...data,
  }
}

/**
 * @description Null response
 */
export function createCreatePets201Faker() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsErrorFaker() {
  return createPetNotFoundFaker()
}

export function createCreatePetsMutationRequestFaker(data: NonNullable<Partial<CreatePetsMutationRequest>> = {}) {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...data,
  }
}

export function createCreatePetsMutationResponseFaker() {
  return undefined
}
