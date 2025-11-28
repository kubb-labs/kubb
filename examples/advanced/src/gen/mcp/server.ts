import { listLinkedAccountsHandler } from './linkedAccountsRequests/listLinkedAccounts.ts'
import { createIncomingTransferHandler } from './transfersRequests/createIncomingTransfer.ts'
import { createTransferHandler } from './transfersRequests/createTransfer.ts'
import { getTransfersByIdHandler } from './transfersRequests/getTransfersById.ts'
import { listTransfersHandler } from './transfersRequests/listTransfers.ts'
import { createVendorHandler } from './vendorsRequests/createVendor.ts'
import { deleteVendorHandler } from './vendorsRequests/deleteVendor.ts'
import { getVendorByIdHandler } from './vendorsRequests/getVendorById.ts'
import { listVendorsHandler } from './vendorsRequests/listVendors.ts'
import { updateVendorHandler } from './vendorsRequests/updateVendor.ts'
import { listLinkedAccountsQueryParamsSchema } from '../zod/linkedAccountsController/listLinkedAccountsSchema.ts'
import {
  createIncomingTransferMutationRequestSchema,
  createIncomingTransferHeaderParamsSchema,
} from '../zod/transfersController/createIncomingTransferSchema.ts'
import { createTransferMutationRequestSchema, createTransferHeaderParamsSchema } from '../zod/transfersController/createTransferSchema.ts'
import { getTransfersByIdPathParamsSchema } from '../zod/transfersController/getTransfersByIdSchema.ts'
import { listTransfersQueryParamsSchema } from '../zod/transfersController/listTransfersSchema.ts'
import { createVendorMutationRequestSchema, createVendorHeaderParamsSchema } from '../zod/vendorsController/createVendorSchema.ts'
import { deleteVendorPathParamsSchema } from '../zod/vendorsController/deleteVendorSchema.ts'
import { getVendorByIdPathParamsSchema } from '../zod/vendorsController/getVendorByIdSchema.ts'
import { listVendorsQueryParamsSchema } from '../zod/vendorsController/listVendorsSchema.ts'
import { updateVendorMutationRequestSchema, updateVendorPathParamsSchema, updateVendorHeaderParamsSchema } from '../zod/vendorsController/updateVendorSchema.ts'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'

export const server = new McpServer({
  name: 'Payments API',
  version: '3.0.1',
})

server.tool(
  'createIncomingTransfer',
  '\nThis endpoint creates a new incoming transfer. You may use use any eligible bank account connection to fund (ACH Debit) \nany active Brex business account.\n\n**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any \ngovernmental authority without Brex\'s prior review and approval. This includes but is not limited to any money services\nbusiness or money transmission activity.\n\nPlease review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if \nyou have any questions.\n',
  { data: createIncomingTransferMutationRequestSchema, headers: createIncomingTransferHeaderParamsSchema },
  async ({ data, headers }) => {
    return createIncomingTransferHandler({ data, headers })
  },
)

server.tool(
  'listLinkedAccounts',
  '\nThis endpoint lists all bank connections that are eligible to make ACH transfers to Brex business account\n',
  { params: listLinkedAccountsQueryParamsSchema },
  async ({ params }) => {
    return listLinkedAccountsHandler({ params })
  },
)

server.tool(
  'listTransfers',
  '\nThis endpoint lists existing transfers for an account.\n\nCurrently, the API can only return transfers for the following payment rails:\n- ACH\n- DOMESTIC_WIRE\n- CHEQUE\n- INTERNATIONAL_WIRE\n',
  { params: listTransfersQueryParamsSchema },
  async ({ params }) => {
    return listTransfersHandler({ params })
  },
)

server.tool(
  'createTransfer',
  '\nThis endpoint creates a new transfer.\n\nCurrently, the API can only create transfers for the following payment rails:\n- ACH\n- DOMESTIC_WIRE\n- CHEQUE\n- INTERNATIONAL_WIRES\n\n**Transaction Descriptions**\n* For outgoing check payments, a successful transfer will return a response containing a description value with a format of `Check #<check number> to <recipient_name> - <external_memo>`.\n* For book transfers (from one Brex Business account to another), the recipient value will have a format of `<customer_account.dba_name> - <external_memo>` and the sender will have a format of `<target customer account\'s dba name> - <external_memo>`.\n* For other payment rails, the format will be `<counterparty_name> - <external_memo>`, where Counterparty name is `payment_instrument.beneficiary_name` or `contact.name`\nFor vendors created from the Payments API, the `counterparty_name` will be the `company_name` [field](/openapi/payments_api/#operation/createVendor!path=company_name&t=request).\n\n**Reminder**: You may not use the Brex API for any activity that requires a license or registration from any \ngovernmental authority without Brex\'s prior review and approval. This includes but is not limited to any money services\nbusiness or money transmission activity.\n\nPlease review the <a href="https://www.brex.com/legal/developer-portal/">Brex Access Agreement</a> and contact us if \nyou have any questions.\n',
  { data: createTransferMutationRequestSchema, headers: createTransferHeaderParamsSchema },
  async ({ data, headers }) => {
    return createTransferHandler({ data, headers })
  },
)

server.tool(
  'getTransfersById',
  '\nThis endpoint gets a transfer by ID.\n\nCurrently, the API can only return transfers for the following payment rails:\n- ACH\n- DOMESTIC_WIRE\n- CHEQUE\n- INTERNATIONAL_WIRE\n',
  { id: getTransfersByIdPathParamsSchema.shape['id'] },
  async ({ id }) => {
    return getTransfersByIdHandler({ id })
  },
)

server.tool(
  'listVendors',
  '\nThis endpoint lists all existing vendors for an account.\nTakes an optional parameter to match by vendor name.\n',
  { params: listVendorsQueryParamsSchema },
  async ({ params }) => {
    return listVendorsHandler({ params })
  },
)

server.tool(
  'createVendor',
  '\nThis endpoint creates a new vendor.\n',
  { data: createVendorMutationRequestSchema, headers: createVendorHeaderParamsSchema },
  async ({ data, headers }) => {
    return createVendorHandler({ data, headers })
  },
)

server.tool('getVendorById', '\nThis endpoint gets a vendor by ID.\n', { id: getVendorByIdPathParamsSchema.shape['id'] }, async ({ id }) => {
  return getVendorByIdHandler({ id })
})

server.tool(
  'updateVendor',
  '\n    Updates an existing vendor by ID.\n',
  { id: updateVendorPathParamsSchema.shape['id'], data: updateVendorMutationRequestSchema, headers: updateVendorHeaderParamsSchema },
  async ({ id, data, headers }) => {
    return updateVendorHandler({ id, data, headers })
  },
)

server.tool('deleteVendor', '\nThis endpoint deletes a vendor by ID.\n', { id: deleteVendorPathParamsSchema.shape['id'] }, async ({ id }) => {
  return deleteVendorHandler({ id })
})

async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
