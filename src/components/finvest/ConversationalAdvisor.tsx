import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Bot,
  RefreshCw,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { PortfolioResult } from "../../lib/finvest/types";
import { generateSmartLocalAnswer, type ChatMessage } from "../../lib/advisor-engine";
import { formatINR } from "../../lib/formatters";

interface ConversationalAdvisorProps {
  portfolio: PortfolioResult;
}

export function ConversationalAdvisor({ portfolio }: ConversationalAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your **FinVest AI Portfolio Copilot**. 

I have analyzed your **${formatINR(portfolio.input.totalCapital)}** mandate across the **${portfolio.input.lowPct}% Low / ${portfolio.input.moderatePct}% Moderate / ${portfolio.input.highPct}% High** risk sleeves. Every figure I provide is strictly grounded in deterministic risk math.

Feel free to ask about any specific allocation rationale, downside stress tests, or asset selections!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickQuestions = [
    `Why allocate ${formatINR((portfolio.input.totalCapital * portfolio.input.lowPct) / 100, true)} to low risk?`,
    "What happens if the market falls 20%?",
    "Show me an alternative with lower volatility",
    "Explain the Sharpe ratio calculation",
    "Why was Gold ETF included?",
  ];

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsLoading(true);

    try {
      // First try calling the server function if in server environment, or fallback locally
      let answer = "";
      try {
        const { askAdvisor } = await import("../../lib/finvest.functions");
        const { buildContext } = await import("../../lib/finvest/narrate.server");
        const contextStr = buildContext(portfolio.input, portfolio as any);
        const res = await askAdvisor({
          data: {
            question: q,
            context: contextStr,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          },
        });
        if (res?.answer && !res.answer.includes("AI key is not configured") && !res.answer.includes("unavailable")) {
          answer = res.answer;
        } else {
          // Fallback to rich deterministic local answer
          answer = generateSmartLocalAnswer(q, portfolio);
        }
      } catch (err) {
        answer = generateSmartLocalAnswer(q, portfolio);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: generateSmartLocalAnswer(q, portfolio),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col h-[520px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border/60 p-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              FinVest Conversational Copilot
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Grounded in deterministic risk engine data • Real-time reasoning
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]!])}
          className="rounded-lg p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Clear chat history"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : "border border-border/70 bg-muted/30 text-foreground rounded-tl-xs"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-1 text-xs">
                  {m.content.split("\n\n").map((para, pIdx) => {
                    if (para.startsWith("### ")) {
                      return (
                        <h4 key={pIdx} className="font-bold text-sm text-foreground pt-1 pb-0.5">
                          {para.replace("### ", "")}
                        </h4>
                      );
                    }
                    if (para.startsWith("#### ")) {
                      return (
                        <h5 key={pIdx} className="font-semibold text-xs text-foreground pt-0.5">
                          {para.replace("#### ", "")}
                        </h5>
                      );
                    }
                    return <p key={pIdx}>{para}</p>;
                  })}
                </div>

                <div
                  className={`text-[10px] text-right ${
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Synthesizing engine facts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20 shrink-0 overflow-x-auto flex gap-1.5 no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 py-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-blue-500" />
          Suggested:
        </span>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="shrink-0 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-border/60 bg-background rounded-b-2xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputQuestion);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask anything about risk, allocations, drawdown..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
