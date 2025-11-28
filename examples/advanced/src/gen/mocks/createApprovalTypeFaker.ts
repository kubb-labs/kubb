import type { ApprovalType } from '../models/ts/ApprovalType.ts'
import { faker } from '@faker-js/faker'

/**
 * @description Specifies the approval type for the transaction. \n`MANUAL` requires a cash admin to approve the transaction before disbursing funds. \nWhen not set, the default policy will apply.
 */
export function createApprovalTypeFaker() {
  return faker.helpers.arrayElement<ApprovalType>(['MANUAL'])
}
