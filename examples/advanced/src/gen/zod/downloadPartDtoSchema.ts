import type { DownloadPartDto } from '../models/ts/DownloadPartDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const downloadPartDtoSchema = z.object({
  downloadedWelds: z.array(z.string()),
}) as unknown as ToZod<DownloadPartDto>

export type DownloadPartDtoSchema = DownloadPartDto
