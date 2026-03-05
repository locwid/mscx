<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import z from 'zod'
import { importYouTubeQuery } from '~/shared/queries'

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const schema = z.object({
  url: z.string().url(),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  url: '',
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  await importYouTubeQuery(event.data.url)
  emit('submit')
}
</script>

<template>
  <UForm class="space-y-4" :state="state" :schema="schema" @submit="onSubmit">
    <UFormField label="playlist url" name="url">
      <UInput v-model="state.url" class="w-full" />
    </UFormField>
    <div>
      <UButton block size="xl" type="submit">import</UButton>
    </div>
  </UForm>
</template>
