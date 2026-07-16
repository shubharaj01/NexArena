import { Match } from "./mockDb";

const API_BASE = ""; // Relative path to connect to FastAPI origin

export interface ChatRequest {
  user_id: string;
  conversation_id: string;
  message: string;
}

export interface ChatResponse {
  conversation_id: string;
  response: string;
  timestamp: string;
}

export interface MessageHistory {
  id?: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface AnnouncementItem {
  id: number;
  category: 'congestion' | 'weather' | 'emergency' | 'info';
  original_text: string;
  tone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
}

export interface ItineraryPlan {
  planner_id: string;
  user_id: string;
  arrival_plan: string;
  gate_recommendation: string;
  route: string;
  food_timing: string;
  exit_strategy: string;
  updated_at: string;
}

export const ssApi = {
  // Chat Bot API
  sendChatMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  getChatHistory: async (conversationId: string): Promise<MessageHistory[]> => {
    try {
      const res = await fetch(`${API_BASE}/chat/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId })
      });
      if (res.ok) {
        const data = await res.json();
        return data.history || [];
      }
    } catch (e) {
      console.warn("Could not retrieve history: ", e);
    }
    return [];
  },

  getFaqs: async (category?: string): Promise<FAQItem[]> => {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE}/faq${query}`);
    if (!res.ok) throw new Error('Failed to fetch FAQs');
    return res.json();
  },

  // Announcements API
  getAnnouncements: async (): Promise<AnnouncementItem[]> => {
    const res = await fetch(`${API_BASE}/announcement/history`);
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return res.json();
  },

  generateAnnouncement: async (category: string, coreDetails: string): Promise<AnnouncementItem> => {
    const res = await fetch(`${API_BASE}/announcement/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, core_details: coreDetails })
    });
    if (!res.ok) throw new Error('Failed to generate announcement');
    return res.json();
  },

  translateAnnouncement: async (announcementId: number, targetLanguage: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/announcement/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement_id: announcementId, target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Failed to translate announcement');
    const data = await res.json();
    return data.translated_text;
  },

  approveAnnouncement: async (announcementId: number, status: 'approved' | 'rejected'): Promise<AnnouncementItem> => {
    const res = await fetch(`${API_BASE}/announcement/${announcementId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to approve/reject announcement');
    return res.json();
  },

  // Multilingual Translator API
  translateText: async (text: string, targetLanguage: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/translate/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Failed to translate text');
    const data = await res.json();
    return data.translated_text;
  },

  synthesizeSpeech: async (text: string, targetLanguage: string): Promise<{ translated_text: string; audio_url: string }> => {
    const res = await fetch(`${API_BASE}/translate/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Failed to synthesize speech');
    return res.json();
  },

  // Match Day Planner API
  createPlan: async (
    userId: string,
    ticket: { gate: string; section: string; row: string; seat: string },
    parking: string,
    matchDetails: Match,
    preferences: { arrival_buffer: string }
  ): Promise<ItineraryPlan> => {
    const res = await fetch(`${API_BASE}/planner/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        ticket: {
          gate: ticket.gate,
          section: ticket.section,
          row: ticket.row,
          seat: ticket.seat
        },
        parking: parking,
        match_schedule: {
          kickoff_time: matchDetails.time,
          gates_open: '15:00' // Stubbed default
        },
        preferences: {
          arrival_buffer: preferences.arrival_buffer
        }
      })
    });
    if (!res.ok) throw new Error('Failed to create itinerary plan');
    return res.json();
  },

  updatePlan: async (plannerId: string, changedContext: string): Promise<ItineraryPlan> => {
    const res = await fetch(`${API_BASE}/planner/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planner_id: plannerId,
        changed_context: changedContext
      })
    });
    if (!res.ok) throw new Error('Failed to adjust plan');
    return res.json();
  }
};
