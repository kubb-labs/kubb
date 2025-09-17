export const weldPackTypeEnum = {
  SETUP: 'SETUP',
  DEMO: 'DEMO',
  FULL: 'FULL',
} as const

export type WeldPackTypeEnum = (typeof weldPackTypeEnum)[keyof typeof weldPackTypeEnum]

export type WeldPackType = WeldPackTypeEnum
