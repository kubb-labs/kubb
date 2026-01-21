import { faker } from '@faker-js/faker'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUserFaker } from '../createUserFaker.ts'

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

export function createCreateUsersWithListInputMutationRequestFaker(data?: CreateUsersWithListInputMutationRequest) {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])] as CreateUsersWithListInputMutationRequest
}

export function createCreateUsersWithListInputMutationResponseFaker(data?: Partial<CreateUsersWithListInputMutationResponse>) {
  return data || (faker.helpers.arrayElement<any>([createCreateUsersWithListInput200Faker()]) as CreateUsersWithListInputMutationResponse)
}
