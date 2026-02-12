<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import z from 'zod'
import { addTracksQuery } from '~/shared/queries'

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const schema = z.object({
  files: z.file().array().min(1),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  files: [],
})


const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  await addTracksQuery(event.data.files)
  emit('submit')
}
</script>

<template>
<UForm
  class="space-y-4"
  :state="state"
  :schema="schema"
  @submit="onSubmit"
>
  <UFormField label="files" name="files">
    <UFileUpload
      v-model="state.files"
      multiple
      layout="list"
      class="w-full min-h-48"
      label="select images to upload"
      accept="audio/*"
    />
  </UFormField>
  <div>
    <UButton block size="xl" type="submit">upload</UButton>
  </div>
</UForm>
</template>
