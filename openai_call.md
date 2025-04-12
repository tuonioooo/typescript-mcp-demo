# OpenAI 与 MCP 工具集成指南

本文档介绍如何将 OpenAI 的大语言模型与 Model Context Protocol (MCP) 工具进行集成。

## 架构概述

集成系统主要包含三个核心组件：
1. OpenAI 客户端 - 负责与大语言模型通信
2. MCP 客户端 - 负责与 MCP 服务器通信
3. 工具映射层 - 将 OpenAI 工具调用转换为 MCP 工具调用

## 初始化配置

### OpenAI 客户端配置
```typescript
const client = new OpenAI({
  apiKey: "your-api-key",  // 从相应平台获取
  baseURL: "https://api.siliconflow.cn/v1"  // API 端点
});

const model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';  // 使用的模型
```

### MCP 客户端配置
```typescript
const sseTransport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
const mcpClient = new Client({
  name: "gjld-ai-client",
  version: "1.0.0"
});
```

## 工具定义与映射

### 定义 OpenAI 工具
工具需要按照 OpenAI 的格式进行定义，包括名称、描述和参数说明：

```typescript
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: 'sse-add',
      description: '使用 sse-add 工具计算两个数字的和',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: '第一个数字' },
          b: { type: 'number', description: '第二个数字' }
        },
        required: ['a', 'b']
      }
    }
  }
];
```

### 工具映射机制

工具映射是通过名称进行的间接连接。工作流程如下：

1. 在 OpenAI 工具定义中声明可用工具及其参数格式
2. 模型返回工具调用请求时，通过 `handleToolCall` 函数处理
3. 根据工具名称将调用映射到相应的 MCP 工具

示例：
```typescript
if (toolCall.function.name === 'sse-add') {
  const result = await mcpClient.callTool({
    name: "sse-add",  // MCP 工具名称
    arguments: args
  });
}
```

## 处理流程

1. 接收用户输入
2. 调用 OpenAI 模型进行对话
3. 如果模型返回工具调用请求：
   - 解析工具调用参数
   - 调用对应的 MCP 工具
   - 将工具返回结果传回模型
4. 获取模型最终响应
5. 返回结果给用户

## 错误处理

代码中包含了多层错误处理：
- 工具参数解析错误处理
- MCP 工具调用错误处理
- 结果格式验证和错误处理
- 连接错误处理

## 最佳实践

1. 保持工具名称一致性
2. 严格定义参数格式
3. 实现完善的错误处理
4. 使用清晰的日志记录
5. 验证工具返回结果

## 调试建议

1. 使用 console.log 跟踪工具调用流程
2. 验证 MCP 服务器连接状态
3. 检查工具返回结果格式
4. 监控模型响应内容