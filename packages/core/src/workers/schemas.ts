import { z } from 'zod'

import type { ZodStringDef, ZodType } from 'zod'
import type { KubbFile } from '../FileManager.ts'

export const importSchema = z.object({
  name: z.union([z.string(), z.array(z.string())]),
  path: z.string(),
  isTypeOnly: z.boolean().optional(),
  isNameSpace: z.boolean().optional(),
  root: z.string().optional(),
})

export const exportSchema = z.object({
  name: z.union([z.string(), z.array(z.string())]).optional(),
  path: z.string(),
  isTypeOnly: z.boolean().optional(),
  asAlias: z.boolean().optional(),
})

export const fileSchema = z.object({
  id: z.string().optional(),
  baseName: z.string() as ZodType<KubbFile.BaseName, ZodStringDef>,
  path: z.string(),
  source: z.string(),
  imports: z.array(importSchema).optional(),
  exports: z.array(exportSchema).optional(),
  override: z.boolean().optional(),
  meta: z.object({}).optional(),
  env: z.object({}).optional(),
})
