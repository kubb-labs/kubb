import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput'

export function createCreateUsersWithListInputMutationRequest(
  override: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = [],
): NonNullable<CreateUsersWithListInputMutationRequest> {
  faker.seed([220])
  return [
    ...faker.helpers.arrayElements([createUser()]) as any,
    ...override,
  ]
}
/**
 * @description Successful operation
 */

export function createCreateUsersWithListInputMutationResponse(
  override?: NonNullable<Partial<CreateUsersWithListInputMutationResponse>>,
): NonNullable<CreateUsersWithListInputMutationResponse> {
  faker.seed([220])
  return createUser(override)
}
