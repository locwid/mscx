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

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const formData = new FormData()
  for (const file of event.data.files) {
    formData.append('files', file)
  }
  try {
    await $fetch('/api/track', { method: 'POST', body: formData })
    refreshNuxtData('tracks')
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <UDrawer title="Upload tracks" :ui="{ content: 'max-w-lg mx-auto' }">
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
