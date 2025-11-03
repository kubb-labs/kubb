import type { AddFilesMutationRequest, AddFilesMutationResponse } from "../../models/ts/petController/AddFiles.ts";

export function addFiles(data: AddFilesMutationRequest): Cypress.Chainable<AddFilesMutationResponse> {
  return cy.request('post', '/pet/files', data).then((res: Cypress.Response<AddFilesMutationResponse>) => res.body)
}