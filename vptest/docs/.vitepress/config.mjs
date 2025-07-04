import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'VitePress Mermaid Test',
    description: 'Testing Mermaid integration',
    base: '/blog/',  // 添加这一行！关键配置
    // 如果需要，可以在这里添加mermaid配置
    mermaid: {
      // mermaid配置选项
    }
  })
)
