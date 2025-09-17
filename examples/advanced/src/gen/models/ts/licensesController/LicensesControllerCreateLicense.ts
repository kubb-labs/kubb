import type { CreateLicenseDto } from '../CreateLicenseDto.ts'
import type { License } from '../License.ts'

export type LicensesControllerCreateLicense201 = License

export type LicensesControllerCreateLicenseMutationRequest = CreateLicenseDto

export type LicensesControllerCreateLicenseMutationResponse = LicensesControllerCreateLicense201

export type LicensesControllerCreateLicenseMutation = {
  Response: LicensesControllerCreateLicense201
  Request: LicensesControllerCreateLicenseMutationRequest
  Errors: any
}
