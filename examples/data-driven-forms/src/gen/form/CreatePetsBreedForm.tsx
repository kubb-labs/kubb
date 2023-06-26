import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer'
import componentMapper from '@data-driven-forms/ant-component-mapper/component-mapper'
import FormTemplate from '@data-driven-forms/ant-component-mapper/form-template'
import type { CreatePetsBreedMutationRequest, CreatePetsBreedMutationResponse, CreatePetsBreedPathParams } from '../models'

/**
 * @summary Create a pet breed
 * @link /pets/:breed
 */

type FieldValues = CreatePetsBreedMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<CreatePetsBreedMutationResponse> | void
  breed: CreatePetsBreedPathParams['breed']
}

export function CreatePetsBreedForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const schema = {
    fields: [
      {
        component: 'text-field',
        name: 'name',
        label: 'Name',
      },

      {
        component: 'text-field',
        name: 'tag',
        label: 'Tag',
      },

      {
        component: 'checkbox',
        name: 'isActive',
        label: 'Is active',
      },
    ],
  }
  return <FormRenderer schema={schema} componentMapper={componentMapper} FormTemplate={FormTemplate} onSubmit={onSubmit} />
}
