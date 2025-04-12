import { OpenAI } from 'openai';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check for necessary environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing environment variable OPENAI_API_KEY. Please ensure you have created .env file or set the environment variable.');
  process.exit(1);
}

if (!process.env.OPENAI_BASE_URL) {
  console.error('Missing environment variable OPENAI_BASE_URL. Please ensure you have created .env file or set the environment variable.');
  process.exit(1);
}

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

//const model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B';
const model = process.env.MODEL_NAME || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';

// Initialize MCP client
const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:3001/sse';
const sseTransport = new SSEClientTransport(new URL(mcpServerUrl));

const mcpClient = new Client({
  name: "gjld-ai-client",
  version: "1.0.0"
});

`
tools: ChatCompletionTool[] 和 MCP 工具的匹配是通过名称进行的，而非直接导入或在该方法中实现。这是一个间接连接的机制，工作流程如下：
1. 在 tools 数组中定义了OpenAI格式的工具，例如 sse-add 和 get-greeting
2. 当模型返回工具调用时，handleToolCall 函数会接收这个调用
3. 在 handleToolCall 函数中，通过判断 toolCall.function.name 来确定调用哪个MCP工具

关键连接点在于：

if (toolCall.function.name === 'sse-add') {
    // 调用MCP工具
    const result = await mcpClient.callTool({
      name: "sse-add",  // 这里是实际MCP工具的名称
      arguments: args
    });
  }

  所以，这里的匹配是基于名称的映射，而非直接导入：

1. OpenAI的工具定义只是对模型的描述，告诉模型可用哪些工具
2. 当模型决定使用工具时，您的代码负责将该调用映射到实际的MCP工具
3. mcpClient 连接到您的MCP服务器，服务器端定义了真正的工具实现

这种设计允许您的前端和后端保持松耦合，前端只需知道工具名称和参数格式，而不需要了解具体实现细节。

`

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
  },
  {
    type: "function",
    function: {
      name: 'get-greeting',
      description: 'Get a personalized greeting for someone using the greeting URI',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Person name to greet',
          }
        },
        required: ['name'],
      }
    }
  }
];

// Type guard to check if an object is an array
function isContentArray(obj: any): obj is Array<any> {
  return Array.isArray(obj);
}

// Function to handle tool calls using MCP
async function handleToolCall(toolCall: any) {
  console.log("Tool call received:", toolCall.function.name);
  console.log("Tool call arguments:", toolCall.function.arguments);
  let args;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch (error) {
    console.error("Error parsing arguments:", error);
    return "Error parsing tool arguments";
  }
  
  if (toolCall.function.name === 'sse-add') {
    // Call the MCP sse-add tool
    try {
      console.log("Calling sse-add with args:", args);
      const result = await mcpClient.callTool({
        name: "sse-add",  // 这个名称需要匹配服务器上定义的工具名称
        arguments: args
      });
      
      console.log("Tool result:", JSON.stringify(result, null, 2));
      // Safely access content
      if (result && typeof result === 'object' && 'content' in result) {
        const content = result.content;
        if (isContentArray(content) && content.length > 0 && 
            typeof content[0] === 'object' && 'text' in content[0]) {
          return content[0].text;
        }
      }
      return "Error processing tool result";
    } catch (error) {
      console.error("Tool call error:", error);
      return "Tool call failed: " + (error instanceof Error ? error.message : String(error));
    }
  } 
  else if (toolCall.function.name === 'get-greeting') {
    // Use the MCP resource for greeting
    try {
      const name = args.name;
      console.log("Reading greeting resource for:", name);
      
      // 我们需要使用正确的URI模板格式
      const uri = `sse-greeting://${name}`;
      console.log("Using URI:", uri);
      
      // 尝试列出所有可用资源（调试用）
      try {
        const allResources = await mcpClient.listResources();
        console.log("Available resources before reading:", allResources);
      } catch (err) {
        console.warn("Could not list resources:", err);
      }
      
      // 读取sse-greeting资源
      const resource = await mcpClient.readResource({
        uri: uri
      });
      
      console.log("Resource result:", JSON.stringify(resource, null, 2));
      if (resource && typeof resource === 'object' && 'contents' in resource) {
        const contents = resource.contents;
        if (isContentArray(contents) && contents.length > 0 && 
            typeof contents[0] === 'object' && 'text' in contents[0]) {
          return contents[0].text;
        }
      }
      return "No greeting text available";
    } catch (error) {
      console.error("Resource read error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error details:", errorMessage);
      
      // 如果发生错误，尝试另一种URI格式（以防服务器期望不同的格式）
      try {
        console.log("Trying alternative URI format...");
        const name = args.name;
        const alternativeUri = `sse-greeting://${name}`;
        console.log("Using alternative URI:", alternativeUri);
        
        const resource = await mcpClient.readResource({
          uri: alternativeUri
        });
        
        console.log("Alternative resource result:", JSON.stringify(resource, null, 2));
        if (resource && typeof resource === 'object' && 'contents' in resource) {
          const contents = resource.contents;
          if (isContentArray(contents) && contents.length > 0 && 
              typeof contents[0] === 'object' && 'text' in contents[0]) {
            return contents[0].text;
          }
        }
        return "No greeting text available from alternative URI";
      } catch (altError) {
        console.error("Alternative URI also failed:", altError);
        return "Error retrieving greeting: " + errorMessage;
      }
    }
  }
  return "Tool not found";
}

// Function to interact with the large language model
async function functionCallPlayground(prompt: string): Promise<string> {
  // First message from user
  let messages: any[] = [{ role: 'user', content: prompt }];
  
  // First completion with tool calls
  console.log("Sending initial request to model with tools");
  const response = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0.01,
    top_p: 0.95,
    tools
  });

  console.log("Model response:", response.choices[0].message);
  // Handle tool call
  const toolCalls = response.choices[0].message.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    console.log("No tool calls in response");
    return response.choices[0].message.content || "No response from model";
  }

  // Process the tool call
  const toolCall = toolCalls[0];
  console.log("Processing tool call:", toolCall);
  const toolResult = await handleToolCall(toolCall);
  console.log("Tool result:", toolResult);

  // Add assistant message and tool result to the conversation
  messages.push(response.choices[0].message);
  messages.push({
    role: 'tool',
    content: toolResult,
    tool_call_id: toolCall.id
  });

  console.log("Sending follow-up request to model");
  // Get final response after tool call
  const finalResponse = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0.01,
    top_p: 0.95
  });

  console.log("Final response:", finalResponse.choices[0].message);
  return finalResponse.choices[0].message.content || "No response from model";
}

// Initialize the MCP connection and run the demo
async function main() {
  try {
    console.log("Connecting to MCP server at:", sseTransport);
    // Connect to the MCP server
    await mcpClient.connect(sseTransport);
    console.log("Connected to MCP server successfully");
    
    // 验证连接和可用资源
    console.log("Checking available tools and resources...");
    
    // 尝试获取服务器的可用资源列表
    try {
      const resources = await mcpClient.listResources();
      console.log("Available resources:", resources);
    } catch (error) {
      console.warn("Error listing resources:", error);
    }

    // Test prompts
    const prompts = [
      "用中文回答：4和4的和是多少?",
      "用中文回答：给Lucy一个问候"
    ];
    
    for (const prompt of prompts) {
      console.log(`\n-------------------------------`);
      console.log(`Processing prompt: ${prompt}`);
      try {
        const result = await functionCallPlayground(prompt);
        console.log(`Response: ${result}`);
      } catch (error) {
        console.error(`Error processing prompt "${prompt}":`, error);
      }
      console.log(`-------------------------------\n`);
    }
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

// Run the main function
main().catch(error => {
  console.error("Unhandled error in main:", error);
});
