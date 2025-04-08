import { serve } from "bun";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MessageParam, Tool, ToolUnion } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

import readline from "readline/promises";
import dotenv from "dotenv";

import index from "./index.html";
import { readFile } from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

type RelClient = {
  server: string;
  name: string;
  version: string;
  client: Client;
  tools: Tool[];
};

class RelClientImpl implements RelClient {
  server: string;
  name: string;
  version: string;
  client: Client;
  tools: Tool[] = [];
  constructor(server: string, name: string, version: string, client: Client) {  
    this.server = server;
    this.name = name;
    this.version = version;
    this.client = client;
  }
}

class McpClients {
  static clients: RelClient[] = [];
  static llm: Anthropic = new Anthropic({apiKey: process.env["ANTHROPIC-API-KEY"]});
  static tools: any[] = [];
  static messages: MessageParam[] = [];


  constructor() {

  }
  
  // Loop through config and create mcp clients for each entry
  static async createClients() {
    const config = await getConfig();
    const mcpServers: Record<string, { command: string; args: string[] }> = config.mcpServers;
    const responses: string[] = [];
  
    for (const key of Object.keys(mcpServers)) {
      const client = new Client({ name: "tool-client", version: "1.0.0" });
      const transport = await new StdioClientTransport({
        command: mcpServers[key].command,
        args: mcpServers[key].args,
      });
  
      // Connect to the Mcp server
      await client.connect(transport);
      const mcpClient = new RelClientImpl(key, "tool-client", "1.0.0", client);
      McpClients.clients.push(mcpClient);
      responses.push(`Connected to ${key}`);
    }
  
    return responses;
  }

  static async getTools() {
    const toolSet: Tool[] = [];
    for (const mcpClient of McpClients.clients) {
      const tools = await McpClients.getServerTools(mcpClient);
      tools.forEach((tool) => toolSet.push(tool));
          mcpClient.tools = tools;
    };
    McpClients.tools = toolSet.map(tool => ({
      name: tool.name, // Ensure 'name' is included at the top level
      description: tool.description,
      input_schema: tool.input_schema
    }));

    return McpClients.clients;
  }

  static async getServerTools(relClient: RelClient) {
    const client = relClient.client;
    const toolResult = await client.listTools();
    const mappedTools = toolResult.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }
    });

    return mappedTools;
  }

  // Proces Query
  static async processQuery(role: "user" | "assistant", content: string) {
    const userMessage: MessageParam = { role, content };

    McpClients.messages.push(userMessage);

    try {
      const response = await McpClients.llm.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        messages: McpClients.messages,
        tools: McpClients.tools,
      });
  
      // Need to loop through the response.content[] and add to messages or execute tool call
      for (const content of response.content) {
        if (content.type === "text") {
          McpClients.messages.push({
            role: "assistant",
            content: content.text,
          });
        } else if (content.type === "tool_use") {
          const name = content.name;
          const input = content.input;

          // Find client that has tool with name
          const client = McpClients.clients.find((relClient) => {
            return relClient.tools.some((tool) => tool.name === name);
          });

          if (client) {
            const result = await client.client.callTool({ name, arguments: input as { [x: string]: unknown } | undefined });
            console.log(result);
            const toolResponse = (result.content as Array<{ text: string }>)[0].text;
            McpClients.messages.push({
              role: "assistant",
              content: toolResponse
            });              
          }
        };
      }

      return {role: "assistant", content: McpClients.messages.slice(-1)[0].content};
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  }
}

const connect = async () => {
  const message = await McpClients.createClients();
  const clients = await McpClients.getTools();
  return {message, clients};
}

const getConfig = async () => {
  try {
    const jsonData = await readFile("./src/data/mcp_server_config.json", "utf-8");
    return JSON.parse(jsonData); // Parse the JSON string into an object
  } catch (error) {
    console.error("Error reading JSON file:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/getConfig": {
      async GET(req) {
        try {
          // Read the static JSON file
          const jsonData = await getConfig();
          // Parse and return the JSON data
          return Response.json(jsonData);
        } catch (error) {
          // Handle errors (e.g., file not found)
          return new Response("Error reading JSON file", { status: 500 });
        }
      },
    },
    "/api/hello": {
      async GET(req) {
        const result = connect();
        return Response.json({
          message: "Connecting...",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },
    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
    "/api/connect": async (req) => {
      const message = await McpClients.createClients();
      const clients = await McpClients.getTools();
      return Response.json({message, clients});
    },
    "/api/chat": {
      async POST(req) {
        console.log("Processing /api/chat request");
        const body = await req.text();
        const message = await McpClients.processQuery("user", body);

        return Response.json({message});
      }
    }
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
