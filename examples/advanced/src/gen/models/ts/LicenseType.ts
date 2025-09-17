export const licenseTypeEnum = {
  SETUP: 'SETUP',
  DEMO: 'DEMO',
  FULL: 'FULL',
} as const

export type LicenseTypeEnum = (typeof licenseTypeEnum)[keyof typeof licenseTypeEnum]

export type LicenseType = LicenseTypeEnum
