import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createCreateUsersWithListInput200() {
  faker.seed([220])
  return createUser()
}

/**
 * @description successful operation
 */
export function createCreateUsersWithListInputError() {
  faker.seed([220])
  return undefined
}

export function createCreateUsersWithListInputMutationRequest(
  data?: Partial<CreateUsersWithListInputMutationRequest>,
): CreateUsersWithListInputMutationRequest {
  faker.seed([220])
  return [...(faker.helpers.multiple(() => createUser()) as any), ...(data || [])]
}

export function createCreateUsersWithListInputMutationResponse(
  data?: Partial<CreateUsersWithListInputMutationResponse>,
): CreateUsersWithListInputMutationResponse {
  faker.seed([220])
  return data || faker.helpers.arrayElement<any>([createCreateUsersWithListInput200()])
}
