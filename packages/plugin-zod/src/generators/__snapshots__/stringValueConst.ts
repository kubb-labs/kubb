/**
 * @description its value is equal to the value of the keyword
 */
export const stringValueConst = z.object({ foobar: z.literal('foobar') }).describe('its value is equal to the value of the keyword')
