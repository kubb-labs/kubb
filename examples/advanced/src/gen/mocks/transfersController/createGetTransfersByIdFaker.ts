import type { GetTransfersByIdPathParams, GetTransfersByIdQueryResponse } from '../../models/ts/transfersController/GetTransfersById.ts'
import { createTransferFaker } from '../createTransferFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetTransfersByIdPathParamsFaker(data?: Partial<GetTransfersByIdPathParams>): GetTransfersByIdPathParams {
  return {
    ...{ id: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Returns a transfer.
 */
export function createGetTransfersById200Faker() {
  return createTransferFaker()
}

/**
 * @description Bad request
 */
export function createGetTransfersById400Faker() {
  return undefined
}

/**
 * @description Unauthorized
 */
export function createGetTransfersById401Faker() {
  return undefined
}

/**
 * @description Forbidden
 */
export function createGetTransfersById403Faker() {
  return undefined
}

/**
 * @description Internal server error
 */
export function createGetTransfersById500Faker() {
  return undefined
}

export function createGetTransfersByIdQueryResponseFaker(data?: Partial<GetTransfersByIdQueryResponse>): GetTransfersByIdQueryResponse {
  return data || faker.helpers.arrayElement<any>([createGetTransfersById200Faker()])
}
