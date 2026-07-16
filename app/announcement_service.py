import os
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models import Announcement

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

class AnnouncementService:
    @staticmethod
    async def generate_announcement(db: Session, category: str, core_details: str) -> Announcement:
        system_instruction = (
            "You are a public safety and crowd control announcer for a FIFA World Cup stadium. "
            "Write a clear, calm, and professional announcement based on the details provided. "
            "Keep the phrasing concise and reassuring, explicitly designed to prevent panic."
        )
        prompt = f"Category: {category}\nDetails: {core_details}"
        
        if not client:
            announcement_text = f"[Safety Announcement] Notice regarding {category.upper()}: {core_details}. Please remain calm."
        else:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=150,
                    temperature=0.3,
                    timeout=2.5
                )
                announcement_text = response.choices[0].message.content
            except Exception:
                announcement_text = f"Attention: Standard update regarding {category}. {core_details}."

        db_announcement = Announcement(
            category=category,
            original_text=announcement_text,
            tone="calm",
            status="pending"
        )
        db.add(db_announcement)
        db.commit()
        db.refresh(db_announcement)
        return db_announcement
