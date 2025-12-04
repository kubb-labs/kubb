import { faker } from '@faker-js/faker'
import type { TransferStatus } from '../models/ts/TransferStatus.ts'

/**
 * @description `PROCESSING`: We have started to process the sending or receiving of this transaction.\n`SCHEDULED`: The transaction is scheduled to enter the `PROCESSING` status.\n`PENDING_APPROVAL`: The transaction requires approval before it can enter the `SCHEDULED` or `PROCESSING` status.\n`FAILED`: A grouping of multiple terminal states that prevented the transaction from completing.\nThis includes a a user-cancellation, approval being denied, insufficient funds, failed verifications, etc.\n`PROCESSED`: The money movement has been fully completed, which could mean money sent has arrived.\n
 */
export function createTransferStatusFaker() {
  return faker.helpers.arrayElement<TransferStatus>(['PROCESSING', 'SCHEDULED', 'PENDING_APPROVAL', 'FAILED', 'PROCESSED'])
}
