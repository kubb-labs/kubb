import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer'
import componentMapper from '@data-driven-forms/ant-component-mapper/component-mapper'
import FormTemplate from '@data-driven-forms/ant-component-mapper/form-template'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models'

/**
 * @summary Create a pet
 * @link /pets
 */

type FieldValues = CreatePetsMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<CreatePetsMutationResponse> | void
}

export function CreatePetsForm(props: Props): React.ReactNode {
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
    ],
  }
  return <FormRenderer schema={schema} componentMapper={componentMapper} FormTemplate={FormTemplate} onSubmit={onSubmit} />
}
