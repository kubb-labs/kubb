import { faker } from '@faker-js/faker'
import type { CreateIncomingTransferHeaderParams, CreateIncomingTransferMutationResponse } from '../../models/ts/transfersController/CreateIncomingTransfer.ts'
import { createCreateIncomingTransferRequestFaker } from '../createCreateIncomingTransferRequestFaker.ts'
import { createTransferFaker } from '../createTransferFaker.ts'

export function createCreateIncomingTransferHeaderParamsFaker(data?: Partial<CreateIncomingTransferHeaderParams>): CreateIncomingTransferHeaderParams {
  return {
    ...{ 'Idempotency-Key': faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description createIncomingTransfer 200 response
 */
export function createCreateIncomingTransfer200Faker() {
  return createTransferFaker()
}

export function createCreateIncomingTransferMutationRequestFaker() {
  return createCreateIncomingTransferRequestFaker()
}

export function createCreateIncomingTransferMutationResponseFaker(
  data?: Partial<CreateIncomingTransferMutationResponse>,
): CreateIncomingTransferMutationResponse {
  return data || faker.helpers.arrayElement<any>([createCreateIncomingTransfer200Faker()])
}
