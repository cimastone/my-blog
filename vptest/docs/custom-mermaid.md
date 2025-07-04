# Custom Mermaid Component Example

## 使用自定义Mermaid组件

<Mermaid :code="'flowchart TD\n    A --> B\n    B --> C\n    C --> D'" />

## 复杂的流程图示例

<Mermaid :code="'graph TB\n    A[Start] --> B{Is it?}\n    B -->|Yes| C[OK]\n    C --> D[Rethink]\n    D --> B\n    B ---->|No| E[End]'" />

## 时序图示例

<Mermaid :code="'sequenceDiagram\n    participant A as Alice\n    participant B as Bob\n    A->>B: Hello Bob, how are you?\n    B-->>A: Great!'" />