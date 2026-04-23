/**
 * Basename (without extension) of generated barrel files.
 *
 * Used to detect whether a path already points at a barrel so the generator
 * avoids re-creating one on top of it.
 */
export const BARREL_BASENAME = 'index' as const

/**
 * File name used for generated barrel (index) files.
 */
export const BARREL_FILENAME = `${BARREL_BASENAME}.ts` as const
