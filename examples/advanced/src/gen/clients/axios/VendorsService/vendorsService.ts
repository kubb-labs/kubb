import { createVendor } from './createVendor.ts'
import { deleteVendor } from './deleteVendor.ts'
import { getVendorById } from './getVendorById.ts'
import { listVendors } from './listVendors.ts'
import { updateVendor } from './updateVendor.ts'

export function vendorsService() {
  return { listVendors, createVendor, getVendorById, updateVendor, deleteVendor }
}
