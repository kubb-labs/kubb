import { File, Type } from '@kubb/react'

import type { OasTypes } from '@kubb/oas'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  api: OasTypes.OASDocument
}

export function OasType({ name, typeName, api }: Props) {
  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        {`export const ${name} = ${JSON.stringify(api, undefined, 2)} as const`}
      </File.Source>
      <br />
      <File.Source name={typeName} isExportable isIndexable isTypeOnly>
        <Type name={typeName} export>
          {`Infer<typeof ${name}>`}
        </Type>
      </File.Source>
    </>
  )
}
