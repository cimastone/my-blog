import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'VitePress Mermaid Test',
    description: 'Testing Mermaid integration',
    mermaid: {
      // mermaid配置选项
    }
  })
)
