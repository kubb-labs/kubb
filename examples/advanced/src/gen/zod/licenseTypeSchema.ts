import type { LicenseType } from '../models/ts/LicenseType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const licenseTypeSchema = z.enum(['SETUP', 'DEMO', 'FULL']) as unknown as ToZod<LicenseType>

export type LicenseTypeSchema = LicenseType
