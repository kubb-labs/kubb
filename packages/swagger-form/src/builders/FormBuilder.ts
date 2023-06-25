/* eslint- @typescript-eslint/explicit-module-boundary-types */
import { createJSDocBlockText } from '@kubb/core'
import type { Resolver } from '@kubb/swagger'
import { OasBuilder, getComments, isReference } from '@kubb/swagger'

import type { Operation, OperationSchemas } from '@kubb/swagger'
import { getParams } from '@kubb/swagger'
import { DevTool } from '@hookform/devtools'

type Config = {
  operation: Operation
  schemas: OperationSchemas
  errors: Resolver[]
  name: string
  withDevtools?: boolean
}

type FormResult = { source: string; name: string }

export class FormBuilder extends OasBuilder<Config> {
  private get mutation(): FormResult {
    const { name, operation, schemas, withDevtools } = this.config

    const pathParamsTyped = getParams(schemas.pathParams, { typed: true })
    const comments = getComments(operation)

    const options = [
      pathParamsTyped,
      schemas.queryParams?.name ? `params${!schemas.queryParams.schema.required?.length ? '?' : ''}: ${schemas.queryParams.name}` : '',
    ].filter(Boolean)

    const properties = schemas.request?.schema?.properties || {}
    const required = schemas.request?.schema?.required

    //TODO move to FormGenerator(like we have done with FakerGenerator, ...)
    const inputs = Object.keys(properties)
      .map((name) => {
        const schema = properties[name as keyof typeof properties]
        const isRequired = required && required.includes(name)

        if (isReference(schema)) {
          return undefined
        }

        if (schema.type === 'string') {
          return `
          <label>${name}</label>
          <input {...register("${name}", { required: ${isRequired ? 'true' : 'false'} })} defaultValue="${(schema.default as string) || ''}" />
          {errors['${name}'] && <p>This field is required</p>}
        `
        }
      })
      .filter(Boolean)

    const defaultValues = Object.keys(properties)
      .map((key) => {
        const schema = properties[key as keyof typeof properties]

        if (isReference(schema)) {
          return undefined
        }

        if (schema.type === 'string') {
          return `${key}: ""`
        }
      })
      .filter(Boolean)

    const source = `
    ${createJSDocBlockText({ comments })}

    type Props = {
      onSubmit?: (data: ${schemas.response.name}) => Promise<void> | void; 
      ${options.join(';\n')}
    }

    export function ${name}(props: Props): React.ReactNode {
      const { onSubmit } = props;

      const {
        control,
        register,
        handleSubmit,
        formState: { errors }
      } = useForm<${schemas.response.name}>({
        defaultValues: {
          ${defaultValues.join(',\n')}
        }
      });

      return (
        <>
          <form
            onSubmit={handleSubmit((data) => {
              onSubmit?.(data)
            })}
          >
            ${inputs.join('\n')}
            <input type="submit" />
            ${withDevtools ? `<DevTool id="${operation.getOperationId()}" control={control} styles={{ button: { position: 'relative' } }} />` : ''}
          </form>
       
        </>
      );
    };
  `

    return { source, name }
  }

  configure(config: Config): this {
    this.config = config

    return this
  }

  print(): string {
    const codes: string[] = []

    const { source: mutation } = this.mutation

    codes.push(mutation)

    return codes.join('\n')
  }
}
