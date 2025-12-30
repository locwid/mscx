<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import z from 'zod'

const schema = z.object({
  files: z.file().array().min(1),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  files: [],
})

const open = ref(false)
const { addTrack } = useTracks()

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  await addTrack(event.data.files)
  open.value = false
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    title="Upload tracks"
    :ui="{ content: 'max-w-lg mx-auto' }"
  >
    <slot />
    <template #body>
      <UForm
        class="space-y-4"
        :state="state"
        :schema="schema"
        @submit="onSubmit"
      >
        <UFormField label="Files" name="files">
          <UFileUpload
            v-model="state.files"
            multiple
            layout="list"
            class="w-full min-h-48"
            label="Select images to upload"
            accept="audio/*"
          />
        </UFormField>
        <div>
          <UButton block size="xl" type="submit">Upload</UButton>
        </div>
      </UForm>
    </template>
  </UDrawer>
</template>
