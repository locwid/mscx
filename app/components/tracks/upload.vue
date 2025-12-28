<template>
  <UDrawer title="Upload tracks" :ui="{ content: 'max-w-lg mx-auto'}">
    <slot />
    <template #body>
      <UFileUpload multiple class="w-full min-h-48" label="Select images to upload" accept="audio/*" />
    </template>
  </UDrawer>
</template>
