import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsPathParamsFaker(data?: Partial<CreatePetsPathParams>): Partial<CreatePetsPathParams> {
  return {
    ...{ uuid: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsQueryParamsFaker(data?: Partial<CreatePetsQueryParams>): Partial<CreatePetsQueryParams> {
  return {
    ...{ offset: faker.number.int() },
    ...(data || {}),
  }
}

export function createCreatePetsHeaderParamsFaker(data?: Partial<CreatePetsHeaderParams>): Partial<CreatePetsHeaderParams> {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<any>(['ONE', 'TWO', 'THREE']) },
    ...(data || {}),
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

export function createCreatePetsMutationRequestFaker(data?: Partial<CreatePetsMutationRequest>): Partial<CreatePetsMutationRequest> {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsMutationResponseFaker(data?: Partial<CreatePetsMutationResponse>): Partial<CreatePetsMutationResponse> {
  return data || faker.helpers.arrayElement<any>([createCreatePets201Faker()])
}
