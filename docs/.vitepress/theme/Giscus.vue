<template>
  <div id="giscus_container"></div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

function renderGiscus() {
  const el = document.getElementById('giscus_container')
  if (!el) return
  el.innerHTML = ''
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'cimastone/giscus_discussion')
  script.setAttribute('data-repo-id', 'R_kgDOPF8x1A')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', 'DIC_kwDOPF8x1M4CsZmh')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.crossOrigin = 'anonymous'
  script.async = true
  el.appendChild(script)
}

onMounted(renderGiscus)

watch(
  () => route.path,
  () => {
    renderGiscus()
  }
)
</script>
