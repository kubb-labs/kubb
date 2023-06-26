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
  logLevel: 'info',
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({ output: 'models.ts' }),
    createForm({
      output: './form',
      withDevtools: true,
      overrides: {
        form: {
          template: `
          export function {{name}}(props: Props): React.ReactNode {
            const { onSubmit } = props;
            
            const schema = {
              fields: [
               {{fields}}
              ]
            }
            return (
              <FormRenderer
                schema={schema}
                componentMapper={componentMapper}
                FormTemplate={FormTemplate}
                onSubmit={onSubmit}
              />
            );
          };
        `,
          imports: [
            {
              name: 'FormRenderer',
              path: '@data-driven-forms/react-form-renderer/form-renderer',
            },
            {
              name: 'componentTypes',
              path: '@data-driven-forms/react-form-renderer/component-types',
            },
            {
              name: 'componentMapper',
              path: '@data-driven-forms/ant-component-mapper/component-mapper',
            },
            {
              name: 'FormTemplate',
              path: '@data-driven-forms/ant-component-mapper/form-template',
            },
          ],
        },
        mapper: {
          describe: {
            template: '',
          },
          required: {
            template: '',
          },
          string: {
            template: `
            {
              component: 'text-field',
              name: '{{name}}',
              label: '{{label}}'
            },
           `,
          },
          boolean: {
            template: `
            {
              component: 'checkbox',
              name: '{{name}}',
              label: '{{label}}'
            },
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
