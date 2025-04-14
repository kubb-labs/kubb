import type {
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsPathParamsFaker(data?: Partial<CreatePetsPathParams>): CreatePetsPathParams {
  return {
    ...{ uuid: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsQueryParamsFaker(data?: Partial<CreatePetsQueryParams>): CreatePetsQueryParams {
  return {
    ...{ offset: faker.number.int() },
    ...(data || {}),
  }
}

export function createCreatePetsHeaderParamsFaker(data?: Partial<CreatePetsHeaderParams>): CreatePetsHeaderParams {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<NonNullable<CreatePetsHeaderParams>['X-EXAMPLE']>(['ONE', 'TWO', 'THREE']) },
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

export function createCreatePetsMutationRequestFaker(data?: Partial<CreatePetsMutationRequest>): CreatePetsMutationRequest {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsMutationResponseFaker(data?: Partial<CreatePetsMutationResponse>): CreatePetsMutationResponse {
  return data || faker.helpers.arrayElement<any>([createCreatePets201Faker()])
}
