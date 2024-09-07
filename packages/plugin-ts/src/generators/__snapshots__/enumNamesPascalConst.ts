export const EnumNamesPascalConst = {
  Pending: 0,
  Received: 1,
} as const

type EnumNamesPascalConst = (typeof EnumNamesPascalConst)[keyof typeof EnumNamesPascalConst]

export type enumNamesPascalConst = EnumNamesPascalConst
