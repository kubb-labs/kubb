import type { ReactNode } from 'react'

type OperationsProps = {
  /**
   * Name of the function
   */
  name: string
  handlers: string[]
}

export function Operations({ name, handlers }: OperationsProps): ReactNode {
  return <>{`export const ${name} = ${JSON.stringify(handlers).replaceAll(`"`, '')} as const`}</>
}
