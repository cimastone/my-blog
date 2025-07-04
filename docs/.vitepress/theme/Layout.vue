<template>
  <DefaultTheme.Layout>
    <template #doc-after>
      <Giscus />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import Giscus from './Giscus.vue'
</script>
