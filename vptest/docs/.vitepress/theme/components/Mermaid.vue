<template>
  <div ref="mermaidContainer" class="mermaid-container">
    <div ref="mermaidElement" class="mermaid"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  id: {
    type: String,
    default: () => `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
})

const mermaidContainer = ref(null)
const mermaidElement = ref(null)

onMounted(async () => {
  try {
    // 动态导入mermaid
    const mermaid = await import('mermaid')
    
    mermaid.default.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    })

    await nextTick()
    
    if (mermaidElement.value) {
      mermaidElement.value.innerHTML = props.code
      mermaidElement.value.setAttribute('data-processed', 'false')
      await mermaid.default.init(undefined, mermaidElement.value)
    }
  } catch (error) {
    console.error('Failed to render Mermaid diagram:', error)
    if (mermaidElement.value) {
      mermaidElement.value.innerHTML = `<pre>Error rendering Mermaid diagram: ${error.message}</pre>`
    }
  }
})
</script>

<style scoped>
.mermaid-container {
  margin: 1rem 0;
}

.mermaid {
  text-align: center;
  background: transparent;
}
</style>