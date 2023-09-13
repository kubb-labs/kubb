import { faker } from '@faker-js/faker'

import { createPetNotFound } from '../createPetNotFound'
import { CreatePets201 } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationRequest } from '../../models/ts/petsController/CreatePets'
import { CreatePetsMutationResponse } from '../../models/ts/petsController/CreatePets'
import { CreatePetsPathParams } from '../../models/ts/petsController/CreatePets'
import { CreatePetsQueryParams } from '../../models/ts/petsController/CreatePets'
import { CreatePetsError } from '../../models/ts/petsController/CreatePets'

/**
 * @description Null response
 */
export function createCreatePets201(): CreatePets201 {
  return undefined
}

export function createCreatePetsMutationRequest(): CreatePetsMutationRequest {
  return { name: faker.string.alpha(), tag: faker.string.alpha() }
}

export function createCreatePetsMutationResponse(): CreatePetsMutationResponse {
  return undefined
}

export function createCreatePetsPathParams(): CreatePetsPathParams {
  return { uuid: faker.string.alpha() }
}

export function createCreatePetsQueryParams(): CreatePetsQueryParams {
  return { offset: faker.number.float({}) }
}

/**
 * @description unexpected error
 */
export function createCreatePetsError(): CreatePetsError {
  return createPetNotFound()
}
