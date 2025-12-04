import { faker } from '@faker-js/faker'
import type { CreateTransferHeaderParams, CreateTransferMutationResponse } from '../../models/ts/transfersController/CreateTransfer.ts'
import { createCreateTransferRequestFaker } from '../createCreateTransferRequestFaker.ts'
import { createTransferFaker } from '../createTransferFaker.ts'

export function createCreateTransferHeaderParamsFaker(data?: Partial<CreateTransferHeaderParams>): CreateTransferHeaderParams {
  return {
    ...{ 'Idempotency-Key': faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description createTransfer 200 response
 */
export function createCreateTransfer200Faker() {
  return createTransferFaker()
}

export function createCreateTransferMutationRequestFaker() {
  return createCreateTransferRequestFaker()
}

export function createCreateTransferMutationResponseFaker(data?: Partial<CreateTransferMutationResponse>): CreateTransferMutationResponse {
  return data || faker.helpers.arrayElement<any>([createCreateTransfer200Faker()])
}
