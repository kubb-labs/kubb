import type { OriginatingAccountType } from '../models/ts/OriginatingAccountType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const originatingAccountTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<OriginatingAccountType>

export type OriginatingAccountTypeSchema = OriginatingAccountType
