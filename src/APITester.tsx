import React, { useRef, type FormEvent, useState } from "react";

export function APITester() {
  const responseOutputRef = useRef<HTMLTextAreaElement>(null);
  const dataButtfferRef = useRef<HTMLTextAreaElement>(null);
  const [connected, setConnected] = useState(false);

  const getText = () => {
    return async () => {
      try {
        // Logic for the second button
        const res = await fetch("/api/getConfig");
        const json = await res.json();
        responseOutputRef.current!.value = responseOutputRef.current!.value + JSON.stringify(json, null, 2) +
        "\n\nMCP Servers:\n" + dataButtfferRef.current!.value;
        scrollToBottom();
      } catch (error) {
        responseOutputRef.current!.value = String(error);
        scrollToBottom();
      }
    };
  };

  const scrollToBottom = () => {
    if (responseOutputRef.current) {
      responseOutputRef.current.scrollTop = responseOutputRef.current.scrollHeight;
    }
  };

  const connect = async  () => {
    responseOutputRef.current!.value = "Connecting...";
    const res = await fetch("/api/connect");
    const json = await res.json();
    dataButtfferRef.current!.value = JSON.stringify(json, null, 2);
    responseOutputRef.current!.value = "Connected";
  }

  const sendRequest = async (e: FormEvent<HTMLFormElement>) => {
    console.log("Sending Request");
    e.preventDefault();

    if (!connected) {
      await connect();
      setConnected(true);
      return;
    }
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = formData.get("input") as string;
    
    if (!body) return;

    try {
      // Default logic for the "Send" button
      const endpoint = "/api/chat";
      const url = new URL(endpoint, location.href);
      const options: RequestInit = {
        method: "POST",
        body: JSON.stringify({query: body}),
        headers: { "Content-Type": "application/json" } 
      };

      responseOutputRef.current!.value = responseOutputRef.current!.value + "\n" + body;
      scrollToBottom();  
      console.log("making it here - fetch");
      const res = await fetch(url, options);
     
      const data = await res.json();
      console.log("Response: ", res, data);

      if (data.message) {
        responseOutputRef.current!.value = responseOutputRef.current!.value + "\n" + data.message.content;  
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error:", error);
      responseOutputRef.current!.value = String(error);
      scrollToBottom();
    }
  };

  return (
    <div className="w-full text-left flex flex-col gap-4">
     <textarea
        ref={responseOutputRef}
        placeholder="Response will appear here..."
        className="w-full min-h-[520px] bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-3 text-[#fbf0df] font-mono resize-y focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
        readOnly
      />
     <textarea
        ref={dataButtfferRef}
        placeholder="Response will appear here..."
        className="hidden"        
      />
      <form
        onSubmit={sendRequest}
        className="flex items-center gap-2 bg-[#1a1a1a] p-3 rounded-xl font-mono border-2 border-[#fbf0df] transition-colors duration-300 focus-within:border-[#f3d5a3] w-full"
      >
        <input
          type="text"
          name="input"
          className="w-full flex-1 bg-transparent border-0 text-[#fbf0df] font-mono text-base py-1.5 px-2 outline-none focus:text-white placeholder-[#fbf0df]/40"
          placeholder="How can I help you today?"
          readOnly={!connected}
        />
        <button
          type="submit"
          name="action"
          value="send"
          className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer whitespace-nowrap"
        >
          { connected ? ("Send") : ("Connect") }
        </button>
        <button
          type="button"
          name="action"
          value="fetchText"
          className="bg-[#f3d5a3] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#fbf0df] hover:-translate-y-px cursor-pointer whitespace-nowrap"
          onClick={getText()}
        >
          Config
        </button>
      </form>

    </div>
  );
}