<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import z from 'zod'

definePageMeta({
  name: 'auth',
  layout: 'banner',
})

const { authKey } = storeToRefs(useAuthStore())

const schema = z.object({
  authKey: z.string().min(1),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  authKey: '',
})

const onSubmit = (event: FormSubmitEvent<Schema>) => {
  authKey.value = event.data.authKey
  navigateTo('/')
}
</script>

<template>
  <div
    class="flex flex-col gap-8 items-center w-full justify-between h-full py-8"
  >
    <UIcon
      name="i-lucide-music"
      class="size-60 my-auto text-primary animate-pulse"
    />
    <div class="space-y-8 max-w-4/5 w-full">
      <div class="space-y-4 text-center">
        <h1 class="text-5xl">mscx</h1>
        <p class="text-muted">Enter auth key to access to mscx application</p>
      </div>
      <UForm
        :state="state"
        :schema="schema"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField name="authKey">
          <UInput
            v-model="state.authKey"
            type="password"
            placeholder="enter auth key"
            class="w-full"
          />
        </UFormField>
        <UButton label="enter" block type="submit" />
      </UForm>
    </div>
  </div>
</template>
