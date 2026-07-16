from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- MODULE 1: CHAT SCHEMAS ---
class ChatRequest(BaseModel):
    user_id: str = Field(..., example="user_123")
    conversation_id: str = Field(..., example="conv_abc123")
    message: str = Field(..., example="Where is the nearest food court from Gate A?")

class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    timestamp: datetime

class HistoryRequest(BaseModel):
    conversation_id: str = Field(..., example="conv_abc123")

class MessageSchema(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    conversation_id: str
    history: List[MessageSchema]

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str

    class Config:
        from_attributes = True

# --- MODULE 2: ANNOUNCEMENT SCHEMAS ---
class AnnouncementGenerateRequest(BaseModel):
    category: str = Field(..., example="congestion")
    core_details: str = Field(..., example="Heavy bottleneck building up at Gate B due to ticket check delays.")

class AnnouncementResponse(BaseModel):
    id: int
    category: str
    original_text: str
    tone: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnnouncementApprovalRequest(BaseModel):
    status: str = Field(..., example="approved")

# --- MODULE 3: TRANSLATION SCHEMAS ---
class TranslationTextRequest(BaseModel):
    text: str = Field(..., example="Welcome to the stadium. Enjoy the match!")
    target_language: str = Field(..., example="Spanish")

class AnnouncementTranslateRequest(BaseModel):
    announcement_id: int = Field(..., example=1)
    target_language: str = Field(..., example="Arabic")

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str

class SpeechTranslationRequest(BaseModel):
    text: str = Field(..., example="Please evacuate via the nearest exit.")
    target_language: str = Field(..., example="French")

class SpeechTranslationResponse(BaseModel):
    translated_text: str
    target_language: str
    audio_url: str

# --- MODULE 4: MATCH DAY PLANNER SCHEMAS ---
class PlannerCreateRequest(BaseModel):
    user_id: str = Field(..., example="user_123")
    ticket: Dict[str, Any] = Field(..., example={"gate": "Gate A", "section": "104", "row": "12", "seat": "15"})
    parking: Optional[str] = Field(None, example="Parking Lot West C")
    match_schedule: Dict[str, Any] = Field(..., example={"kickoff_time": "18:00", "gates_open": "15:00"})
    preferences: Optional[Dict[str, Any]] = Field(None, example={"food_preference": "vegetarian", "arrival_buffer": "early"})

class PlannerUpdateRequest(BaseModel):
    planner_id: str = Field(..., example="plan_98765")
    changed_context: str = Field(..., example="I am arriving 30 minutes late due to traffic.")

class PlannerResponse(BaseModel):
    planner_id: str
    user_id: str
    arrival_plan: str
    gate_recommendation: str
    route: str
    food_timing: str
    exit_strategy: str
    updated_at: datetime

    class Config:
        from_attributes = True
