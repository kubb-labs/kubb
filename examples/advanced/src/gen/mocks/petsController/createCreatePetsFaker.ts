import { faker } from '@faker-js/faker'
import type {
  CreatePetsHeaderParams,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsRequestData,
  CreatePetsResponseData,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'

export function createCreatePetsPathParamsFaker(data?: Partial<CreatePetsPathParams>): CreatePetsPathParams {
  return {
    ...{ uuid: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsQueryParamsFaker(data?: Partial<CreatePetsQueryParams>): CreatePetsQueryParams {
  return {
    ...{ bool_param: faker.helpers.arrayElement<NonNullable<CreatePetsQueryParams>['bool_param']>([true]), offset: faker.number.int() },
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
export function createCreatePetsStatus201Faker() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsStatusErrorFaker() {
  return createPetNotFoundFaker()
}

export function createCreatePetsRequestDataFaker(data?: Partial<CreatePetsRequestData>): CreatePetsRequestData {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createCreatePetsResponseDataFaker(data?: Partial<CreatePetsResponseData>): CreatePetsResponseData {
  return data || faker.helpers.arrayElement<any>([createCreatePetsStatus201Faker()])
}
