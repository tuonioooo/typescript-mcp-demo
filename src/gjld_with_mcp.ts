import { OpenAI } from 'openai';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
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

const model = process.env.MODEL_NAME || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';

// Initialize MCP client
const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:3001/sse';
const sseTransport = new SSEClientTransport(new URL(mcpServerUrl));

const mcpClient = new Client({
  name: "gjld-ai-client",
  version: "1.0.0"
});

// Define available MCP operations
interface MCPOperation {
  validate: (input: any) => boolean;
  execute: (input: any) => Promise<any>;
}

// Registry of available MCP operations
const mcpOperations: Record<string, MCPOperation> = {
  'add': {
    validate: (args) =>
      typeof args.a === 'number' &&
      typeof args.b === 'number',
    execute: async (args) => {
      const result = await mcpClient.callTool({
        name: "sse-add",
        arguments: { a: args.a, b: args.b }
      });
      return result;
    }
  },
  'greeting': {
    validate: (args) =>
      typeof args.name === 'string' &&
      args.name.trim().length > 0,
    execute: async (args) => {
      const uri = `sse-greeting://${args.name}`;
      const result = await mcpClient.readResource({ uri });
      return result;
    }
  }
};

// Unified interface to execute MCP operations
async function executeMCPOperation(opName: string, args: any): Promise<any> {
  const operation = mcpOperations[opName];

  if (!operation) {
    throw new Error(`未知操作: ${opName}`);
  }

  if (!operation.validate(args)) {
    throw new Error(`参数验证失败: ${JSON.stringify(args)}`);
  }

  return await operation.execute(args);
}

// Direct interaction with LLM to identify intent and extract parameters
async function identifyIntentAndParams(text: string): Promise<{ operation: string; params: any }> {
  const messages: any[] = [
    {
      role: 'system',
      content: `你是一个帮助解析用户意图的助手。
      分析用户输入，并确定用户希望执行的操作以及必要的参数。
      支持的操作:
      1. add - 数学加法，需要提取两个数字参数 a 和 b
      2. greeting - 问候某人，需要提取名字参数 name
      
      
      返回JSON格式，包含以下字段:
      - operation: 字符串，值为 "add" 或 "greeting"
      - params: 对象，包含操作所需的参数
    
      
      例如，"帮我计算3加5"应返回: {"operation": "add", "params": {"a": 3, "b": 5}}
      "向小明问好"应返回: {"operation": "greeting", "params": {"name": "小明"}}
      json格式要求严格和正确，不能有多余的空格或换行。
      `
    },
    {
      role: 'user',
      content: text
    }
  ];

  const json_schema = {
    "type": "object",
    "properties": {
      "operation": { "type": "string" },
      "params": { "type": "object" }
    }
  }

  const response: any = await client.chat.completions.create({
    model: model,
    messages,
    temperature: 0.01,
    top_p: 0.95,
    response_format: {"type": "json_object"}
  });

  try {
    const content = response.choices[0].message.content || response.choices[0].message.reasoning_content || '{}';
    console.log("LLM响应内容:", response.choices[0].message);
    const result = JSON.parse(content);

    return {
      operation: result.operation,
      params: result.params
    };
  } catch (error) {
    console.error("解析LLM响应失败:", error);
    throw new Error("无法解析意图和参数");
  }
}

// Process natural language input
async function processNaturalLanguage(userInput: string): Promise<string> {
  try {
    console.log("处理用户输入:", userInput);

    // 1. 分析用户意图并提取参数
    const { operation, params } = await identifyIntentAndParams(userInput);
    console.log("识别到意图:", operation, "参数:", params);

    // 2. 直接执行MCP操作
    const result = await executeMCPOperation(operation, params);
    console.log("MCP操作结果:", JSON.stringify(result));
    let text = ''
    if(result.contents && result.contents.length > 0) {
        text = result.contents[0].text 
    } else if (result.content && result.content.length > 0) {
        text = result.content[0].text
    }

    // 3. 使用LLM生成自然语言回复
    const messages: any[] = [
      {
        role: 'system',
        content: '你是一个友好的助手，将操作结果转换为自然语言回复。'
      },
      {
        role: 'user',
        content: `用户说: "${userInput}"，操作结果是: ${JSON.stringify(text)}。请生成友好的回复。`
      }
    ];

    const llmResponse = await client.chat.completions.create({
      model: model,
      messages,
      temperature: 0.7
    });

    return llmResponse.choices[0].message.content || "抱歉，我无法生成回复。";
  } catch (error) {
    console.error("处理错误:", error);
    return `处理请求时发生错误: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Initialize connection and run demo
async function main() {
  try {
    console.log("连接到MCP服务器:", mcpServerUrl);
    await mcpClient.connect(sseTransport);
    console.log("成功连接到MCP服务器");

    // 测试提示语
    const prompts = [
      "请帮我计算 3 加 5 等于多少",
      "请给 Alice 一个友好的问候"
    ];

    for (const prompt of prompts) {
      console.log(`\n-------------------------------`);
      console.log(`处理提示语: ${prompt}`);
      try {
        const result = await processNaturalLanguage(prompt);
        console.log(`回复: ${result}`);
      } catch (error) {
        console.error(`处理 "${prompt}" 时发生错误:`, error);
      }
      console.log(`-------------------------------\n`);
    }
  } catch (error) {
    console.error("致命错误:", error);
  } finally {
    // 记录连接状态
    console.log("MCP 演示完成，资源已释放");
    // 注意：MCP SDK Client 类似乎没有提供明确的断开连接方法
    // 如果后续发现性能或资源泄漏问题，可能需要实现其他资源清理方式
  }
}

// 运行主函数
main().catch(error => {
  console.error("未处理的错误:", error);
  process.exit(1);
});


