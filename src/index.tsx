import { serve } from "bun";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

import readline from "readline/promises";
import dotenv from "dotenv";

import index from "./index.html";
import { readFile } from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

class MCPClient {
  static clients: Client[] = [];
  static tools: Tool[] = [];
  static llm: Anthropic;

  constructor() {
    MCPClient.llm = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  // Loop through config and create mcp clients for each entry
  static async createClients() {
    const config = await getConfig();
    const mcpServers: Record<string, { command: string; args: string[] }> = config.mcpServers;
    const message: string[] = [];
    Object.keys(mcpServers).forEach((key: string) => {
      const client = new Client({  name: "tool-client", version: "1.0.0" });
      const transport = new StdioClientTransport({command: mcpServers[key].command, args: mcpServers[key].args});
      client.connect(transport);
      MCPClient.clients.push(client);
      message.push(`Added Client ${key}`);
    });
    
    return message;
  }

  // Proces Query
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
          return Response.json(JSON.parse(jsonData));
        } catch (error) {
          // Handle errors (e.g., file not found)
          return new Response("Error reading JSON file", { status: 500 });
        }
      },
    },
    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
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
    "/api/connect": (req) => {
      const message = MCPClient.createClients();
      return Response.json(message);
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
