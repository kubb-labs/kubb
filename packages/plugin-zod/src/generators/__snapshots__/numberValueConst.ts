import { z } from 'zod'

/**
 * @description its value is equal to the value of the keyword
 */
export const numberValueConst = z.object({ foobar: z.literal(42) }).describe('its value is equal to the value of the keyword')
