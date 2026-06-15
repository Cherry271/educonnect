import { useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  MessageSquare,
  Plus,
  User,
  Users,
  Image as ImageIcon,
  Video,
  Mic,
  Square,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  X,
  Check,
  Volume2,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { messagesApi, searchApi, getMediaUrl } from "../api/client";
import { usePinStore } from "../store/pinStore";
import toast from "react-hot-toast";

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
  file_url?: string;
  voice_url?: string;
  message_type?: string;
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
  const { togglePinChat, isChatPinned } = usePinStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "direct" | "groups">("all");

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Media upload refs
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Audio Timer Effect
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messagesApi.conversations();
      const convs = response.data || [];
      setConversations(convs);
      if (initialConversationId) {
        const conv = convs.find(
          (c: Conversation) => c.id === initialConversationId,
        );
        if (conv) selectConversation(conv);
      } else if (convs.length > 0 && !selectedConversation) {
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
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Upload attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.loading(`Uploading ${type}...`, { id: "uploading" });
      const uploadRes = await messagesApi.uploadFile(formData);
      const fileUrl = uploadRes.data.url;
      toast.success(`${type} uploaded!`, { id: "uploading" });

      const msgRes = await messagesApi.sendPayload(selectedConversation.id, {
        content: `Sent a ${type}`,
        file_url: fileUrl,
        message_type: type,
      });

      setMessages((prev) => [...prev, msgRes.data]);
      await loadConversations();
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed", { id: "uploading" });
    } finally {
      setIsSending(false);
    }
  };

  // Voice recording triggers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });

        setIsSending(true);
        const formData = new FormData();
        formData.append("file", audioFile);

        try {
          toast.loading("Uploading voice note...", { id: "uploading" });
          const uploadRes = await messagesApi.uploadFile(formData);
          const voiceUrl = uploadRes.data.url;
          toast.success("Voice note sent!", { id: "uploading" });

          const msgRes = await messagesApi.sendPayload(selectedConversation.id!, {
            content: "Sent a voice note",
            voice_url: voiceUrl,
            message_type: "voice",
          });

          setMessages((prev) => [...prev, msgRes.data]);
          await loadConversations();
        } catch (error) {
          console.error("Voice upload failed", error);
          toast.error("Voice note upload failed", { id: "uploading" });
        } finally {
          setIsSending(false);
        }

        // Stop all track streams
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      // Discard recorded chunks
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast.error("Recording discarded");
    }
  };

  // Edit / Delete operations
  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditText(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim() || !selectedConversation) return;

    try {
      const response = await messagesApi.edit(messageId, editText.trim());
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: response.data.content } : msg))
      );
      setEditingMessageId(null);
      toast.success("Message updated!");
      await loadConversations();
    } catch (error) {
      console.error("Failed to edit message", error);
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await messagesApi.delete(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message deleted");
      await loadConversations();
    } catch (error) {
      console.error("Failed to delete message", error);
      toast.error("Failed to delete message");
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

  // Tab Filtering
  const filteredConversations = conversations.filter((c) => {
    if (activeSubTab === "direct") return !c.is_group;
    if (activeSubTab === "groups") return c.is_group;
    return true;
  });

  const activeChatTitle = selectedConversation
    ? selectedConversation.is_group
      ? selectedConversation.group_name
      : selectedConversation.participant_names.join(", ")
    : "Chat";

  const isPinned = selectedConversation ? isChatPinned(selectedConversation.id) : false;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-5 min-h-[calc(100vh-140px)]">
      {/* Sidebar Section */}
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

        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-[#161616] border border-gray-900 rounded-xl mb-4">
          {(["all", "direct", "groups"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                activeSubTab === tab
                  ? "bg-primary-400 text-dark-bg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
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
          {isSearching && (
            <p className="text-xs text-gray-500 mt-2 pl-2 animate-pulse">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-2xl border border-gray-800 bg-[#101210] p-3 space-y-2 relative z-20">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user.id)}
                  className="w-full text-left rounded-2xl border border-gray-800 bg-[#1a1d1b] px-3 py-3 transition hover:border-primary-400 cursor-pointer"
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="text-sm text-gray-400 py-4 text-center animate-pulse">Loading conversations…</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">
              No {activeSubTab === "all" ? "" : activeSubTab} conversations yet.
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left rounded-2xl border px-4 py-3.5 transition flex items-center justify-between gap-3 cursor-pointer ${
                  selectedConversation?.id === conv.id
                    ? "border-primary-400/50 bg-[#1f2623]"
                    : "border-gray-900 bg-[#101210] hover:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border shrink-0 ${conv.is_group ? "bg-amber-950/20 border-amber-900/30 text-amber-400" : "bg-emerald-950/20 border-emerald-900/30 text-[#3ddc97]"}`}>
                    {conv.is_group ? <Users size={16} /> : <User size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">
                        {conv.is_group
                          ? conv.group_name
                          : conv.participant_names.join(", ") || "Conversation"}
                      </p>
                      {isChatPinned(conv.id) && (
                        <Pin size={10} className="text-emerald-400 fill-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <span className="text-[9px] text-gray-500">
                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ""}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary-400 text-dark-bg text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Active Chat Window */}
      <div className="bg-[#121413] border border-gray-900 rounded-3xl flex flex-col overflow-hidden min-h-[600px]">
        {/* Chat Header */}
        <div className="border-b border-gray-900/60 p-5 bg-[#161616]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedConversation && (
                <div className={`p-2.5 rounded-xl border ${selectedConversation.is_group ? "bg-amber-950/20 border-amber-900/30 text-amber-400" : "bg-emerald-950/20 border-emerald-900/30 text-[#3ddc97]"}`}>
                  {selectedConversation.is_group ? <Users size={18} /> : <User size={18} />}
                </div>
              )}
              <div>
                <h2 className="text-white text-base font-bold flex items-center gap-2">
                  {activeChatTitle}
                  {selectedConversation && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#202221] border border-gray-800 rounded text-gray-500 tracking-wider">
                      {selectedConversation.is_group ? "Group" : "Direct"}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedConversation
                    ? "Active conversation thread"
                    : "Select or start a conversation."}
                </p>
              </div>
            </div>

            {/* Pin Chat Actions */}
            {selectedConversation && (
              <button
                onClick={() => {
                  togglePinChat({
                    id: selectedConversation.id,
                    title: activeChatTitle,
                    is_group: selectedConversation.is_group,
                    last_message: selectedConversation.last_message,
                    last_message_at: selectedConversation.last_message_at,
                  });
                  toast.success(isPinned ? "Chat unpinned" : "Chat pinned!");
                }}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isPinned
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                    : "border-gray-800 text-gray-400 hover:text-white hover:bg-[#202221]"
                }`}
                title={isPinned ? "Unpin chat" : "Pin chat"}
              >
                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col">
          {selectedConversation ? (
            isLoading ? (
              <div className="text-sm text-gray-400 text-center py-6 animate-pulse">Loading messages…</div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const isMe = message.sender_id === user?.id;
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`max-w-[70%] rounded-3xl px-4 py-3.5 flex flex-col relative group transition ${
                      isMe
                        ? "bg-[#1f2623] border border-[#3ddc97]/15 text-white self-start mr-auto rounded-tl-none"
                        : "bg-[#1a1d1b] border border-gray-800/80 text-gray-200 self-end ml-auto rounded-tr-none"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 mb-1 border-b border-gray-900/30 pb-1 shrink-0">
                      <span className="text-[10px] font-bold text-gray-400">
                        {isMe ? "You" : message.sender_name}
                      </span>
                      {/* Actions Menu (Edit/Delete) - only for sender messages */}
                      {isMe && !isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ml-2 shrink-0">
                          <button
                            onClick={() => handleStartEdit(message)}
                            className="p-1 hover:bg-[#2a3631] text-gray-400 hover:text-[#3ddc97] rounded transition"
                            title="Edit message"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 hover:bg-[#2a3631] text-gray-400 hover:text-red-400 rounded transition"
                            title="Delete message"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline Editor */}
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-[#121413] border border-[#3ddc97]/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(message.id);
                            if (e.key === "Escape") setEditingMessageId(null);
                          }}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="p-1 hover:bg-gray-800 rounded text-gray-400 transition"
                          >
                            <X size={12} />
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="p-1 hover:bg-[#2a3631] rounded text-[#3ddc97] transition"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Attachments rendering */}
                        {message.message_type === "image" && message.file_url && (
                          <div className="mb-2 max-w-full rounded-2xl overflow-hidden border border-gray-900 max-h-60 bg-[#121413] flex items-center justify-center">
                            <img
                              src={getMediaUrl(message.file_url)}
                              alt="Attachment preview"
                              className="object-contain max-h-60 w-full"
                            />
                          </div>
                        )}

                        {message.message_type === "video" && message.file_url && (
                          <div className="mb-2 max-w-full rounded-2xl overflow-hidden border border-gray-900 max-h-60 bg-[#121413]">
                            <video
                              src={getMediaUrl(message.file_url)}
                              controls
                              className="w-full max-h-60 object-contain"
                            />
                          </div>
                        )}

                        {message.message_type === "voice" && message.voice_url && (
                          <div className="mb-2 flex items-center gap-2 p-2 bg-[#121413] rounded-xl border border-gray-900 min-w-[200px]">
                            <Volume2 size={16} className="text-[#3ddc97] animate-pulse" />
                            <audio
                              src={getMediaUrl(message.voice_url)}
                              controls
                              className="w-full h-8 scale-90"
                            />
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-gray-500 mt-2 text-right block select-none">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-400 text-center py-12">
                No messages yet — send the first one to start the conversation.
              </div>
            )
          ) : (
            <div className="text-sm text-gray-400 text-center py-12">
              Start by choosing a conversation or searching for a person to message.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="border-t border-gray-900/60 p-4 bg-[#101210]">
          {isRecording ? (
            /* Voice Recording Overlay */
            <div className="flex items-center justify-between gap-3 p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3 pl-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs text-white font-bold tracking-wide">Recording Voice Note...</span>
                <span className="text-xs text-[#3ddc97] font-mono">{formatDuration(recordingDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-[10px] transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={stopRecording}
                  className="p-2.5 bg-primary-400 hover:bg-primary-300 text-dark-bg rounded-full transition cursor-pointer"
                  title="Stop and Send Note"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard input bar with attachment option buttons */
            <div className="flex items-center gap-3">
              {/* Attachment hidden inputs */}
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={(e) => handleFileUpload(e, "image")}
                className="hidden"
              />
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                onChange={(e) => handleFileUpload(e, "video")}
                className="hidden"
              />

              {/* Attachment Actions */}
              {selectedConversation && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isSending}
                    className="p-2.5 hover:bg-[#1a1d1b] border border-gray-900 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="Upload Photo"
                  >
                    <ImageIcon size={15} />
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isSending}
                    className="p-2.5 hover:bg-[#1a1d1b] border border-gray-900 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="Upload Video"
                  >
                    <Video size={15} />
                  </button>
                  <button
                    onClick={startRecording}
                    disabled={isSending}
                    className="p-2.5 hover:bg-[#1a1d1b] border border-gray-900 text-gray-400 hover:text-emerald-400 rounded-xl transition cursor-pointer"
                    title="Record Voice Note"
                  >
                    <Mic size={15} />
                  </button>
                </div>
              )}

              {/* Input field */}
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!selectedConversation || isSending}
                placeholder={
                  selectedConversation
                    ? "Write a message..."
                    : "Select a conversation first"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="flex-1 rounded-2xl border border-gray-800 bg-[#161616] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-primary-400 focus:outline-none"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={
                  !selectedConversation || !newMessage.trim() || isSending
                }
                className={`rounded-full p-3 transition shrink-0 cursor-pointer ${
                  selectedConversation && newMessage.trim() && !isSending
                    ? "bg-primary-400 text-dark-bg hover:bg-primary-300"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
