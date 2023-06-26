import { Checkbox } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'
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

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: undefined,
      tag: undefined,
    },
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        <label htmlFor="name">Name</label>
        <Controller
          name="name"
          render={({ field }) => <input {...field} id="name" />}
          control={control}
          defaultValue={''}
          rules={{
            required: true,
          }}
        />
        {errors['name'] && <p>This field is required</p>}

        <label htmlFor="tag">Tag</label>
        <Controller
          name="tag"
          render={({ field }) => <input {...field} id="tag" />}
          control={control}
          defaultValue={''}
          rules={{
            required: true,
          }}
        />
        {errors['tag'] && <p>This field is required</p>}

        <label htmlFor="isActive">Is active</label>
        <Controller
          name="isActive"
          render={({ field }) => (
            <Checkbox {...(field as any)} id="isActive" type="checkbox" value={field.value ? 'checked' : undefined} checked={field.value} />
          )}
          control={control}
          defaultValue={false}
          rules={{
            required: false,
          }}
        />
        <input type="submit" />
      </form>

      <DevTool id="createPetsBreed" control={control} styles={{ button: { position: 'relative' } }} />
    </>
  )
}
