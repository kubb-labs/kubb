import type { WeldPackType } from '../models/ts/WeldPackType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const weldPackTypeSchema = z.enum(['SETUP', 'DEMO', 'FULL']) as unknown as ToZod<WeldPackType>

export type WeldPackTypeSchema = WeldPackType
