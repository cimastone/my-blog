import { defineConfig } from 'vitepress'
import { mermaidPlugin } from 'vitepress-plugin-mermaid'

export default defineConfig({
  markdown: {
    config(md) {
      md.use(mermaidPlugin)
    }
  }
})
