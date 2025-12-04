import { createIncomingTransfer } from './createIncomingTransfer.ts'
import { createTransfer } from './createTransfer.ts'
import { getTransfersById } from './getTransfersById.ts'
import { listTransfers } from './listTransfers.ts'

export function transfersService() {
  return { createIncomingTransfer, listTransfers, createTransfer, getTransfersById }
}
