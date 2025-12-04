import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { OriginatingAccountType } from '../models/ts/OriginatingAccountType.ts'

export const originatingAccountTypeSchema = z.enum(['BREX_CASH']) as unknown as ToZod<OriginatingAccountType>

export type OriginatingAccountTypeSchema = OriginatingAccountType
