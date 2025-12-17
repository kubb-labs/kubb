import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'

export function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<CreateUsersWithListInputMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/user/createWithList',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<CreateUsersWithListInputMutationResponse>) => res.body)
}
