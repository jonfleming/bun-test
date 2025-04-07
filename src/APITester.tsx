import React, { useRef, type FormEvent } from "react";

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const jsonConfigInputRef = useRef<HTMLTextAreaElement>(null);

  const getText = () => {
    return async () => {
      try {
        // Logic for the second button
        const res = await fetch("/api/getConfig");
        const text = await res.json();
        jsonConfigInputRef.current!.value = JSON.stringify(text, null, 2);
      } catch (error) {
        jsonConfigInputRef.current!.value = String(error);
      }
    };
  };

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const action = formData.get("action") as string;
    console.log(`Form Action: ${action}`);

    try {
      // Default logic for the "Send" button
      const endpoint = formData.get("endpoint") as string;
      const url = new URL(endpoint, location.href);
      const method = formData.get("method") as string;
      const res = await fetch(url, { method });

      const data = await res.json();
      responseInputRef.current!.value = JSON.stringify(data, null, 2);
    } catch (error) {
      responseInputRef.current!.value = String(error);
    }
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
      <form
        onSubmit={testEndpoint}
        className="flex items-center gap-2 bg-[#1a1a1a] p-3 rounded-xl font-mono border-2 border-[#fbf0df] transition-colors duration-300 focus-within:border-[#f3d5a3] w-full"
      >
        <select
          name="method"
          className="bg-[#fbf0df] text-[#1a1a1a] py-1.5 px-3 rounded-lg font-bold text-sm min-w-[0px] appearance-none cursor-pointer hover:bg-[#f3d5a3] transition-colors duration-100"
        >
          <option value="GET" className="py-1">
            GET
          </option>
          <option value="PUT" className="py-1">
            PUT
          </option>
        </select>
        <input
          type="text"
          name="endpoint"
          defaultValue="/api/hello"
          className="w-full flex-1 bg-transparent border-0 text-[#fbf0df] font-mono text-base py-1.5 px-2 outline-none focus:text-white placeholder-[#fbf0df]/40"
          placeholder="/api/hello"
        />
        <button
          type="submit"
          name="action"
          value="send"
          className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer whitespace-nowrap"
        >
          Send
        </button>
        <button
          type="button"
          name="action"
          value="fetchText"
          className="bg-[#f3d5a3] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#fbf0df] hover:-translate-y-px cursor-pointer whitespace-nowrap"
          onClick={getText()}
        >
          Fetch Text
        </button>
      </form>
      <textarea
        ref={jsonConfigInputRef}
        readOnly
        placeholder="config.json will appear here..."
        className="w-full min-h-[140px] bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
      />
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className="w-full min-h-[140px] bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
      />
    </div>
  );
}