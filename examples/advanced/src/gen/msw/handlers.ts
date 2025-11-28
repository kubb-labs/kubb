import { listLinkedAccountsHandler } from './linkedAccountsController/listLinkedAccountsHandler.ts'
import { createIncomingTransferHandler } from './transfersController/createIncomingTransferHandler.ts'
import { createTransferHandler } from './transfersController/createTransferHandler.ts'
import { getTransfersByIdHandler } from './transfersController/getTransfersByIdHandler.ts'
import { listTransfersHandler } from './transfersController/listTransfersHandler.ts'
import { createVendorHandler } from './vendorsController/createVendorHandler.ts'
import { deleteVendorHandler } from './vendorsController/deleteVendorHandler.ts'
import { getVendorByIdHandler } from './vendorsController/getVendorByIdHandler.ts'
import { listVendorsHandler } from './vendorsController/listVendorsHandler.ts'
import { updateVendorHandler } from './vendorsController/updateVendorHandler.ts'

export const handlers = [
  createIncomingTransferHandler(),
  listLinkedAccountsHandler(),
  listTransfersHandler(),
  createTransferHandler(),
  getTransfersByIdHandler(),
  listVendorsHandler(),
  createVendorHandler(),
  getVendorByIdHandler(),
  updateVendorHandler(),
  deleteVendorHandler(),
] as const
