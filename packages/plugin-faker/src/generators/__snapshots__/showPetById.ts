import { faker } from '@faker-js/faker'

export function showPetByIdPathParams(data: NonNullable<Partial<ShowPetByIdPathParams>> = {}) {
  return {
    ...{ petId: faker.string.alpha(), testId: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description Expected response to a valid request
 */
export function showPetById200() {
  return pet()
}

/**
 * @description unexpected error
 */
export function showPetByIdError() {
  return error()
}

/**
 * @description Expected response to a valid request
 */
export function showPetByIdQueryResponse() {
  return pet()
}
