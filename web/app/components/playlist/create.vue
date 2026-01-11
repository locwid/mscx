<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import z from 'zod'

const { addPlaylist } = usePlaylists()

const schema = z.object({
  name: z.string().min(1),
})

type Schema = z.infer<typeof schema>

const open = ref(false)
const state = reactive<Schema>({
  name: '',
})

function onSubmit(event: FormSubmitEvent<Schema>) {
  addPlaylist(event.data.name)
  open.value = false
}
</script>

<template>
  <UDrawer v-model:open="open" title="new playlist">
    <slot />
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField name="name">
          <UInput v-model="state.name" class="w-full" size="xl" />
        </UFormField>
        <UButton block size="xl" type="submit">create</UButton>
      </UForm>
    </template>
  </UDrawer>
</template>
