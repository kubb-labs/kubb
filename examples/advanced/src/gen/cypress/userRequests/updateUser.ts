import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'

export function updateUser(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserMutationRequest,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<UpdateUserMutationResponse> {
  return cy
    .request<UpdateUserMutationResponse>({
      method: 'put',
      url: `/user/${username}`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
