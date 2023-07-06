import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'
import createForm from '@kubb/swagger-form'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ output: 'models.ts' }),
    createForm({
      output: './form',
      withDevtools: true,
      overrides: {
        mapper: {
          boolean: {
            template: `
            <Controller
              name="{{name}}"
              render={({ field }) => (
                <Checkbox {...field as any} id="{{name}}" type="checkbox" value={field.value? "checked": undefined} checked={field.value} />
              )}
              control={control}
              defaultValue={{defaultValue}}
              rules={{
                required: {{required}}
              }}
            />
          `,
            imports: [
              {
                name: ['Checkbox'],
                path: 'antd',
              },
            ],
          },
        },
      },
    }),
  ],
})
