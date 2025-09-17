import type { Part } from '../models/ts/Part.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const partSchema = z.object({
  urn: z.string(),
  downloadedWelds: z.array(z.string()),
  simulatedWelds: z.array(z.string()),
  billedWeldCredits: z.int(),
}) as unknown as ToZod<Part>

export type PartSchema = Part
