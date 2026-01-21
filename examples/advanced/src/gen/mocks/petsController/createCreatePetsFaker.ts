import { faker } from '@faker-js/faker'
import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'

export function createCreatePetsPathParamsFaker(data?: Partial<CreatePetsPathParams>) {
  return {
    ...{ uuid: faker.string.alpha() },
    ...(data || {}),
  } as CreatePetsPathParams
}

export function createCreatePetsQueryParamsFaker(data?: Partial<CreatePetsQueryParams>) {
  return {
    ...{ bool_param: faker.helpers.arrayElement<NonNullable<CreatePetsQueryParams>['bool_param']>([true]), offset: faker.number.int() },
    ...(data || {}),
  } as CreatePetsQueryParams
}

export function createCreatePetsHeaderParamsFaker(data?: Partial<CreatePetsHeaderParams>) {
  return {
    ...{ 'X-EXAMPLE': faker.helpers.arrayElement<NonNullable<CreatePetsHeaderParams>['X-EXAMPLE']>(['ONE', 'TWO', 'THREE']) },
    ...(data || {}),
  } as CreatePetsHeaderParams
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

export function createCreatePetsMutationRequestFaker(data?: Partial<CreatePetsMutationRequest>) {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  } as CreatePetsMutationRequest
}

export function createCreatePetsMutationResponseFaker(data?: Partial<CreatePetsMutationResponse>) {
  return data || (faker.helpers.arrayElement<any>([createCreatePets201Faker()]) as CreatePetsMutationResponse)
}
