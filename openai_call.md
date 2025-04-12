# OpenAI and MCP Tools Integration Guide

## Architecture Overview

The integration system consists of three core components:
1. OpenAI Client - Responsible for communicating with the large language model
2. MCP Client - Responsible for communicating with the MCP server
3. Tool Mapping Layer - Converts OpenAI tool calls to MCP tool calls

## Configuration

### OpenAI Client Setup
```typescript
const client = new OpenAI({
  apiKey: "your-api-key",  // Get from the corresponding platform
  baseURL: "https://api.siliconflow.cn/v1"  // API endpoint
});

const model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';  // Model to use
```

### MCP Client Setup
```typescript
const sseTransport = new SSEClientTransport(new URL("http://localhost:3001/sse"));

const mcpClient = new Client({
  name: "example-client",
  version: "1.0.0"
});

await mcpClient.connect(sseTransport);
```

### Tool Mapping Implementation

The mapping between OpenAI tools and MCP tools is done through names, rather than direct imports or implementation in the method. This is an indirect connection mechanism that works as follows:

1. Tools are defined in the tools array in OpenAI format, such as sse-add and get-greeting
2. When the model returns a tool call, the handleToolCall function receives this call
3. In the handleToolCall function, the appropriate MCP tool is determined by checking toolCall.function.name

The key connection point is:

```typescript
if (toolCall.function.name === 'sse-add') {
    // Call MCP tool
    const result = await mcpClient.callTool({
      name: "sse-add",  // This is the actual MCP tool name
      arguments: args
    });
}
```

So, the matching here is based on name mapping, not direct imports:

1. OpenAI tool definitions are just descriptions for the model, telling it what tools are available
2. When the model decides to use a tool, your code is responsible for mapping that call to the actual MCP tool
3. mcpClient connects to your MCP server, where the actual tool implementations are defined

This design allows your frontend and backend to remain loosely coupled, with the frontend only needing to know tool names and parameter formats, without understanding implementation details.

## Usage Example

Here's how to use the integration:

```typescript
// Define tools that match the API format expected by OpenAI
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: 'sse-add',
      description: 'Compute the sum of two numbers using the sse-add tool',
      parameters: {
        type: 'object',
        properties: {
          a: {
            type: 'number',
            description: 'A number',
          },
          b: {
            type: 'number',
            description: 'A number',
          },
        },
        required: ['a', 'b'],
      }
    }
  }
];

// Function to handle tool calls using MCP
async function handleToolCall(toolCall: any) {
  let args = JSON.parse(toolCall.function.arguments);
  
  if (toolCall.function.name === 'sse-add') {
    const result = await mcpClient.callTool({
      name: "sse-add",
      arguments: args
    });
    return result.content[0].text;
  }
  return "Tool not found";
}

// Example usage
const response = await client.chat.completions.create({
  model: model,
  messages: [{ role: 'user', content: 'What is 4 + 4?' }],
  tools
});

const toolCall = response.choices[0].message.tool_calls[0];
const result = await handleToolCall(toolCall);
console.log(result); // Outputs: 8
```

## Best Practices

1. Error Handling
   - Always validate tool call arguments
   - Handle network errors gracefully
   - Provide meaningful error messages

2. Type Safety
   - Use TypeScript interfaces for tool parameters
   - Validate input/output types
   - Use Zod for runtime type checking

3. Testing
   - Test tool mappings independently
   - Verify error handling
   - Test with different model responses

4. Security
   - Validate all inputs
   - Use appropriate rate limiting
   - Handle authentication properly

## Debugging Tips

1. Enable debug logging for both OpenAI and MCP clients
2. Monitor tool call arguments and responses
3. Use the MCP Inspector tool for testing
4. Check network requests and responses
5. Verify tool definitions match MCP implementations