import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200Faker() {
  return createUserFaker()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputErrorFaker() {
  return undefined
}

export function createCreateUsersWithListInputMutationRequestFaker(data?: Partial<CreateUsersWithListInputMutationRequest>) {
  return [...(faker.helpers.multiple(() => createUserFaker()) as any), ...(data || [])]
}

export function createCreateUsersWithListInputMutationResponseFaker(data?: Partial<CreateUsersWithListInputMutationResponse>) {
  return faker.helpers.arrayElement<any>([createCreateUsersWithListInput200Faker()]) || data
}
