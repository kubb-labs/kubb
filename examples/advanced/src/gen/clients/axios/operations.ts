export const operations = {
  createIncomingTransfer: {
    path: '/v1/incoming_transfers',
    method: 'post',
  },
  listLinkedAccounts: {
    path: '/v1/linked_accounts',
    method: 'get',
  },
  listTransfers: {
    path: '/v1/transfers',
    method: 'get',
  },
  createTransfer: {
    path: '/v1/transfers',
    method: 'post',
  },
  getTransfersById: {
    path: '/v1/transfers/:id',
    method: 'get',
  },
  listVendors: {
    path: '/v1/vendors',
    method: 'get',
  },
  createVendor: {
    path: '/v1/vendors',
    method: 'post',
  },
  getVendorById: {
    path: '/v1/vendors/:id',
    method: 'get',
  },
  updateVendor: {
    path: '/v1/vendors/:id',
    method: 'put',
  },
  deleteVendor: {
    path: '/v1/vendors/:id',
    method: 'delete',
  },
}
