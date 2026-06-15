import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PinnedChat {
  id: string;
  title: string;
  is_group: boolean;
  last_message?: string;
  last_message_at?: string;
}

interface PinState {
  pinnedChats: PinnedChat[];
  togglePinChat: (chat: PinnedChat) => void;
  isChatPinned: (id: string) => boolean;
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      pinnedChats: [],
      togglePinChat: (chat) => {
        const current = get().pinnedChats;
        const exists = current.some((c) => c.id === chat.id);
        if (exists) {
          set({ pinnedChats: current.filter((c) => c.id !== chat.id) });
        } else {
          set({ pinnedChats: [...current, chat] });
        }
      },
      isChatPinned: (id) => {
        return get().pinnedChats.some((c) => c.id === id);
      },
    }),
    { name: "educonnect-pins-v1" },
  ),
);
