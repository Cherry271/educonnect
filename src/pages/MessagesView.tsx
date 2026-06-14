import { useEffect, useRef, useState } from "react";
import { Search, Send, MessageSquare, Plus } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { messagesApi, searchApi } from "../api/client";

interface Conversation {
  id: string;
  participants: string[];
  participant_names: string[];
  is_group: boolean;
  group_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  snippet: string;
  metadata: { username?: string };
}

interface MessagesViewProps {
  initialConversationId?: string;
}

export default function MessagesView({
  initialConversationId,
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conversation = conversations.find(
        (c) => c.id === initialConversationId,
      );
      if (conversation) {
        selectConversation(conversation);
      }
    }
  }, [initialConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await messagesApi.conversations();
      const convs = response.data || [];
      setConversations(convs);
      if (initialConversationId) {
        const conv = convs.find(
          (c: Conversation) => c.id === initialConversationId,
        );
        if (conv) selectConversation(conv);
      } else if (convs.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (error) {
      console.error("Failed to load conversations", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setIsLoading(true);

    try {
      const response = await messagesApi.getMessages(conversation.id);
      setMessages(response.data?.items ?? []);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setIsSending(true);
    const content = newMessage.trim();

    try {
      const response = await messagesApi.send(selectedConversation.id, content);
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      await loadConversations();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchApi.search(query, "people");
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateConversation = async (userId: string) => {
    setIsSending(true);
    try {
      const response = await messagesApi.createConversation({
        participant_ids: [userId],
      });
      const conversation = response.data;
      setConversations((prev) => [
        conversation,
        ...prev.filter((item) => item.id !== conversation.id),
      ]);
      setSearchQuery("");
      setSearchResults([]);
      selectConversation(conversation);
    } catch (error) {
      console.error("Failed to start conversation", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5 min-h-[calc(100vh-140px)]">
      <div className="bg-[#121413] border border-gray-900 rounded-3xl p-5 flex flex-col overflow-hidden min-h-[600px]">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-white font-bold text-lg">Messages</h1>
            <p className="text-gray-400 text-xs mt-1">
              Chat with classmates and collaborators.
            </p>
          </div>
          <div className="rounded-full bg-[#1a1d1b] p-2 border border-gray-900">
            <MessageSquare size={18} className="text-primary-400" />
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search people by name or email"
              className="w-full rounded-2xl border border-gray-800 bg-[#161616] py-3 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-primary-400 focus:outline-none"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-2xl border border-gray-800 bg-[#101210] p-3 space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user.id)}
                  className="w-full text-left rounded-2xl border border-gray-800 bg-[#1a1d1b] px-3 py-3 text-left transition hover:border-primary-400"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {user.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {user.metadata.username || ""}
                      </p>
                    </div>
                    <Plus size={16} className="text-primary-400" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
                    {user.snippet}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="text-sm text-gray-400">Loading conversations…</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-gray-400">
              No conversations yet. Search for a person above to start a chat.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left rounded-3xl border px-4 py-4 transition ${
                  selectedConversation?.id === conv.id
                    ? "border-primary-400/50 bg-[#1f2623]"
                    : "border-gray-800 bg-[#101210] hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {conv.is_group
                        ? conv.group_name
                        : conv.participant_names.join(", ") || "Conversation"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {conv.unread_count > 0 ? `${conv.unread_count} new` : ""}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="bg-[#121413] border border-gray-900 rounded-3xl flex flex-col overflow-hidden min-h-[600px]">
        <div className="border-b border-gray-900/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-white text-lg font-bold">
                {selectedConversation
                  ? selectedConversation.is_group
                    ? selectedConversation.group_name
                    : selectedConversation.participant_names.join(", ")
                  : "Chat"}
              </h2>
              <p className="text-xs text-gray-400">
                {selectedConversation
                  ? "Send a message to your selected conversation."
                  : "Select or start a conversation."}
              </p>
            </div>
            <div className="rounded-full bg-[#1a1d1b] p-2">
              <MessageSquare size={16} className="text-primary-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {selectedConversation ? (
            isLoading ? (
              <div className="text-sm text-gray-400">Loading messages…</div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-3xl px-4 py-3 ${message.sender_id === user?.id ? "bg-primary-400 text-dark-bg self-end" : "bg-[#1a1d1b] text-gray-200 self-start"}`}
                >
                  <p className="text-[11px] text-gray-400 mb-2">
                    {message.sender_name ===
                    user?.first_name + " " + user?.last_name
                      ? "You"
                      : message.sender_name}
                  </p>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-[10px] text-gray-500 mt-2 text-right">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">
                No messages yet — send the first one to start the conversation.
              </div>
            )
          ) : (
            <div className="text-sm text-gray-400">
              Start by choosing a conversation or searching for a person to
              message.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-900/60 p-4 bg-[#101210]">
          <div className="flex items-center gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedConversation}
              placeholder={
                selectedConversation
                  ? "Write a message..."
                  : "Select a conversation first"
              }
              className="flex-1 rounded-full border border-gray-800 bg-[#161616] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-primary-400 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={
                !selectedConversation || !newMessage.trim() || isSending
              }
              className={`rounded-full p-3 transition ${selectedConversation && newMessage.trim() ? "bg-primary-400 text-dark-bg hover:bg-primary-300" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
