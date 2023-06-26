import { useForm, Controller } from 'react-hook-form'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

type FieldValues = { uploadFile?: UploadFileMutationRequest }

type Props = {
  onSubmit?: (data: FieldValues) => Promise<UploadFileMutationResponse> | void
  petId: UploadFilePathParams['petId']
  params?: UploadFileQueryParams
}

export function UploadFileForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {},
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        <Controller
          name="uploadFile"
          render={({ field }) => <input {...field} id="uploadFile" />}
          control={control}
          defaultValue={''}
          rules={{
            required: false,
          }}
        />
        <input type="submit" />
      </form>
    </>
  )
}
