import { serve } from "bun";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

import readline from "readline/promises";
import dotenv from "dotenv";

import index from "./index.html";
import { readFile } from "fs/promises";

dotenv.config();

class MCPClient {
  private clients: Client[] = [];
  private tools: Tool[] = [];

  constructor() {

  }
  
  // Loop through config and create mcp clients for each entry
  async createClients() {
    const config = await getConfig();
    Object.keys(config).forEach((key) => {
      const client = new Client({  name: "tool-client", version: "1.0.0" });
      const transport = new StdioClientTransport({command: config[key].command, args: config[key].args});
      client.connect(transport);
      this.clients.push(client);
  }
  )}
}

const getConfig = async () => {
  try {
    const jsonData = await readFile("./src/data/mcp_server_config.json", "utf-8");
    return jsonData;
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
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
