import { faker } from '@faker-js/faker'
import { createUser } from '../createUser'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput'

export function createCreateUsersWithListInputMutationRequest(
  override: NonNullable<Partial<CreateUsersWithListInputMutationRequest>> = [],
): NonNullable<CreateUsersWithListInputMutationRequest> {
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
  return createUser(override)
}
