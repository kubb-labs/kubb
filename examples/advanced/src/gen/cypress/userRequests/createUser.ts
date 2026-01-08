import type { CreateUserRequestData, CreateUserResponseData } from '../../models/ts/userController/CreateUser.ts'

export function createUser(data?: CreateUserRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<CreateUserResponseData> {
  return cy
    .request<CreateUserResponseData>({
      method: 'post',
      url: '/user',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
