import os
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models import Message
from app.rag_service import RAGService

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SYSTEM_INSTRUCTION = """
You are the official SmartStadium AI assistant for the FIFA World Cup.
Your tasks are:
1. Stadium Q&A.
2. Navigation directions.
3. Ticket support.
4. Food recommendations.
5. Emergency instructions.

Context:
{context}
"""

class ChatbotService:
    @staticmethod
    def get_recent_history(db: Session, conversation_id: str, limit: int = 6) -> list:
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        return [{"role": msg.role, "content": msg.content} for msg in messages[-limit:]]

    @staticmethod
    async def generate_response(db: Session, conversation_id: str, user_message: str) -> str:
        context = RAGService.retrieve_context(user_message)
        history = ChatbotService.get_recent_history(db, conversation_id)
        
        system_prompt = SYSTEM_INSTRUCTION.format(context=context)
        messages_payload = [{"role": "system", "content": system_prompt}]
        
        for msg in history:
            messages_payload.append({"role": msg["role"], "content": msg["content"]})
            
        messages_payload.append({"role": "user", "content": user_message})

        if not client:
            cleaned = user_message.lower().strip().strip("?!.")
            
            # Check for common greetings
            greetings = ["hello", "hi", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening"]
            if any(g == cleaned or cleaned.startswith(g + " ") for g in greetings):
                return (
                    "Hello! Welcome to NexArena. 🌟 I am your virtual match-day assistant. "
                    "How can I help you navigate the stadium or plan your route today? "
                    "You can ask me about gate directions, parking slots, food stalls, or safety exits!"
                )
            
            # Check for thank you messages
            thanks = ["thank you", "thanks", "thank u", "thx", "appreciate it"]
            if any(t in cleaned for t in thanks):
                return (
                    "You're very welcome! 😊 Have a fantastic time at NexArena, and enjoy the match! "
                    "Let me know if you need help with anything else."
                )

            # Return a polished, natural-language response based on RAG context
            if not context or "no specific context found" in context.lower():
                return (
                    "I couldn't find specific details matching your query in the NexArena info database. "
                    "Try asking about gate locations (e.g., Gate A/B), ticket scanners, food stalls (vegetarian/halal), or safety exits!"
                )
            return f"{context}\n\nIs there anything else I can help you with regarding your match day routing?"


            
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages_payload,
                max_tokens=250,
                temperature=0.3,
                timeout=2.5
            )
            return response.choices[0].message.content
        except Exception:
            return "I am currently experiencing connection difficulties. Please ask stadium staff or try again shortly."
