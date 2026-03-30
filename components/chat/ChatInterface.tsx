"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/hooks/useChatStore";
import type { ChatMessage, MarketReport, ParsedQuery } from "@/lib/types";
import { QueryConfirmation } from "./QueryConfirmation";
import { TypingIndicator } from "./TypingIndicator";
import { ReportDisplay } from "@/components/report/ReportDisplay";
import { cn } from "@/lib/utils";
import { Send, RotateCcw, TrendingUp } from "lucide-react";

export function ChatInterface() {
  const { messages, phase, submitQuery, reset } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = phase === "parsing" || phase === "collecting" || phase === "analyzing";
  const isDone = phase === "done";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    submitQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Tendance LK Marché</h1>
            <p className="text-xs text-zinc-500">Veille marché emploi</p>
          </div>
        </div>
        {(phase !== "idle" || messages.length > 1) && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw size={12} />
            Nouvelle recherche
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {isDone && (
            <p className="text-xs text-zinc-500 text-center mb-3">
              Rapport généré. Tapez une nouvelle recherche ou cliquez sur « Nouvelle recherche ».
            </p>
          )}
          <div className="flex items-end gap-2 bg-zinc-900 rounded-xl border border-zinc-700 focus-within:border-indigo-500 transition-colors p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex : alternance marketing digital Paris, CDI développeur React Lyon…"
              rows={1}
              disabled={isLoading}
              className={cn(
                "flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none",
                "max-h-32 overflow-y-auto",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                input.trim() && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-xs text-zinc-600 text-center mt-2">
            Entrée pour envoyer · Shift+Entrée pour un saut de ligne
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (message.type === "report" && message.data) {
    return (
      <div className="animate-slide-up">
        <div className="text-xs text-zinc-500 mb-2 ml-1">Assistant</div>
        <ReportDisplay report={message.data as MarketReport} />
      </div>
    );
  }

  if (message.type === "confirmation" && message.data) {
    return (
      <div className="flex flex-col gap-2 animate-slide-up">
        <div className="text-xs text-zinc-500 ml-1">Assistant</div>
        <AssistantBubble>
          <p className="text-sm mb-3">{message.content}</p>
          <QueryConfirmation query={message.data as ParsedQuery} />
        </AssistantBubble>
      </div>
    );
  }

  if (message.type === "progress") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="text-xs text-zinc-500 italic px-2 py-1">
          ⏳ {message.content}
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="bg-red-900/40 border border-red-700/50 text-red-300 text-sm rounded-xl rounded-tl-sm px-4 py-3 max-w-lg">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex animate-slide-up", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <div className="text-xs text-zinc-500 sr-only">Assistant</div>}
      <div
        className={cn(
          "max-w-lg rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
      {children}
    </div>
  );
}
