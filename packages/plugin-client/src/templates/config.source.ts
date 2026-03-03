// @ts-expect-error - import attributes are handled at build time by importAttributeTextPlugin
import content from '../../templates/config.ts' with { type: 'text' }

export const source = content as string
