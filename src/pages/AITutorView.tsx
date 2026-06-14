import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Plus,
  HelpCircle,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { aiApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  aiProcessing?: boolean;
  concepts?: { title: string; points: string[] };
}

export default function AITutorView() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add user message
    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Call backend API
      const response = await aiApi.chat(textToSend, []);
      const aiTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text:
          response.data.response ||
          response.data.message ||
          response.data.text ||
          "Here is what I found...",
        timestamp: aiTime,
        aiProcessing: false,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("AI service unavailable.", e);
      toast.error("AI assistant is unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }

    setIsLoading(false);
  };

  const handleResetSession = () => {
    setMessages([
      {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: `Hi ${user?.first_name || "there"}! I've started a new session. How can I help you study today?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[750px] bg-[#121413] border border-gray-900 rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="bg-[#1a1d1b] border-b border-gray-900/50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-900 text-primary-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              AI Learning Assistant
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Groq · Llama 3.3 70B • Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSession}
            className="border border-gray-800 hover:border-gray-700 hover:bg-white/[0.02] text-gray-300 text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            New Session
          </button>
          <button className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            <div
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-primary-400 text-dark-bg font-medium rounded-tr-none"
                    : "bg-[#1a1d1b] text-gray-100 border border-gray-900 rounded-tl-none"
                }`}
              >
                {msg.text}

                {msg.aiProcessing && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-accent-tan font-bold">
                    <Sparkles size={10} />
                    AI Processing
                  </div>
                )}
              </div>
            </div>

            <p
              className={`text-[10px] text-gray-500 px-1 ${
                msg.sender === "user" ? "text-right" : "text-left"
              }`}
            >
              {msg.timestamp}
            </p>

            {msg.concepts && (
              <div className="flex justify-start pt-1">
                <div className="bg-[#1a1d1b]/70 border border-gray-900 rounded-2xl p-5 max-w-[80%] w-full">
                  <h3 className="text-primary-400 font-bold text-sm tracking-wide mb-3">
                    {msg.concepts.title}
                  </h3>
                  <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside leading-relaxed">
                    {msg.concepts.points.map((p, idx) => {
                      const splitIdx = p.indexOf(":");
                      if (splitIdx !== -1) {
                        const boldPart = p.substring(0, splitIdx + 1);
                        const normalPart = p.substring(splitIdx + 1);
                        return (
                          <li
                            key={idx}
                            className="marker:text-gray-500 marker:font-bold"
                          >
                            <span className="font-bold text-white">
                              {boldPart}
                            </span>
                            {normalPart}
                          </li>
                        );
                      }
                      return <li key={idx}>{p}</li>;
                    })}
                  </ol>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1d1b] border border-gray-900 text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-gray-500 ml-1">AI Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts / shortcuts */}
      <div className="px-5 py-3 border-t border-gray-900/40 bg-[#121413] flex gap-3 overflow-x-auto">
        <button
          onClick={() =>
            handleSend("Quiz Me: Generate 5 questions from this session")
          }
          className="bg-[#1a1d1b] hover:bg-[#202221] border border-gray-900 hover:border-gray-800 rounded-xl p-3.5 text-left shrink-0 w-[200px] flex flex-col justify-between h-[90px] transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-orange-950 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
            <HelpCircle size={16} />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs tracking-wide">
              Quiz Me
            </h4>
            <p className="text-gray-400 text-[10px] mt-0.5">
              Generate 5 questions from session
            </p>
          </div>
        </button>

        <button
          onClick={() =>
            handleSend("Summarize: Get a quick bullet-point overview")
          }
          className="bg-[#1a1d1b] hover:bg-[#202221] border border-gray-900 hover:border-gray-800 rounded-xl p-3.5 text-left shrink-0 w-[200px] flex flex-col justify-between h-[90px] transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-950 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
            <FileText size={16} />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs tracking-wide">
              Summarize
            </h4>
            <p className="text-gray-400 text-[10px] mt-0.5">
              Get a quick bullet-point overview
            </p>
          </div>
        </button>

        <button
          onClick={() => handleSend("Cite: Generate APA/MLA references")}
          className="bg-[#1a1d1b] hover:bg-[#202221] border border-gray-900 hover:border-gray-800 rounded-xl p-3.5 text-left shrink-0 w-[200px] flex flex-col justify-between h-[90px] transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <LinkIcon size={16} />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs tracking-wide">Cite</h4>
            <p className="text-gray-400 text-[10px] mt-0.5">
              Generate APA/MLA references
            </p>
          </div>
        </button>
      </div>

      {/* Input container */}
      <div className="bg-[#1a1d1b] border-t border-gray-900/50 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center bg-[#202221] border border-gray-800 focus-within:border-primary-400/50 rounded-xl px-3 py-1.5 transition-all"
        >
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Attach materials"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            placeholder="Ask for help with research, summaries, or quizzes..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-0 text-white text-sm py-2 px-3 focus:outline-hidden placeholder:text-gray-500"
          />

          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer mr-1"
            title="Voice input"
          >
            <Mic size={18} />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              inputText.trim()
                ? "bg-primary-400 hover:bg-primary-300 text-dark-bg scale-100"
                : "bg-gray-800 text-gray-600 scale-95 cursor-not-allowed"
            }`}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
