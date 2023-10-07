import type { ReactTemplate } from './ReactTemplate.ts'

export const instances = new WeakMap<NodeJS.WriteStream, ReactTemplate>()
