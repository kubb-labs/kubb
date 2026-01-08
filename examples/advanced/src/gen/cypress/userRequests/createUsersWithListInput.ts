import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../models/ts/userController/CreateUsersWithListInput.ts'

export function createUsersWithListInput(
  data?: CreateUsersWithListInputRequestData,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<CreateUsersWithListInputResponseData> {
  return cy
    .request<CreateUsersWithListInputResponseData>({
      method: 'post',
      url: '/user/createWithList',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
