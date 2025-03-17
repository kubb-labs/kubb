import { z } from 'zod'

export const advanced = z.union([
  z
    .lazy(() => enumerationValueSpecificationDto)
    .and(
      z.object({
        type: z.enum(['enum', 'range', 'regex', 'slider']),
      }),
    ),
  z
    .lazy(() => rangeValueSpecificationDto)
    .and(
      z.object({
        type: z.enum(['enum', 'range', 'regex', 'slider']),
      }),
    ),
  z
    .lazy(() => regexValueSpecificationDto)
    .and(
      z.object({
        type: z.enum(['enum', 'range', 'regex', 'slider']),
      }),
    ),
  z
    .lazy(() => sliderValueSpecificationDto)
    .and(
      z.object({
        type: z.enum(['enum', 'range', 'regex', 'slider']),
      }),
    ),
])
