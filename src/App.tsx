import "./index.css";
import { APITester } from "./APITester";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
    <div className="w-full p-8 text-center relative z-10">
      <div className="flex justify-center items-stretch gap-8">
      </div>
      <p>
        MCP server.config
      </p>
      <APITester />
    </div>
  );
}

export default App;
