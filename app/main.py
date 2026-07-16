import datetime
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import User, Conversation, Message, FAQ, Announcement, MatchPlan
from app.schemas import (
    ChatRequest, ChatResponse, HistoryRequest, HistoryResponse, FAQResponse,
    AnnouncementGenerateRequest, AnnouncementResponse, AnnouncementApprovalRequest,
    TranslationTextRequest, AnnouncementTranslateRequest, TranslationResponse,
    SpeechTranslationRequest, SpeechTranslationResponse,
    PlannerCreateRequest, PlannerUpdateRequest, PlannerResponse
)
from app.chatbot_service import ChatbotService
from app.announcement_service import AnnouncementService
from app.translation_service import TranslationService
from app.planner_service import PlannerService

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartStadium AI - MVP API Backend",
    version="1.0.0",
    description="Unified API hosting Modules 1, 2, 3, and 4."
)

# Ensure static/assets directory exists dynamically to prevent startup crash
os.makedirs(os.path.join(os.path.dirname(__file__), "..", "static", "assets"), exist_ok=True)
app.mount("/assets", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "static", "assets")), name="assets")

@app.get("/stadium_aerial.png")
def get_stadium_aerial():
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "static", "stadium_aerial.png"),
        os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "stadium_aerial.png"),
        os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "stadium_aerial.png")
    ]
    for p in paths:
        if os.path.exists(p):
            return FileResponse(p)
    raise HTTPException(status_code=404, detail="Stadium aerial image not found")

@app.get("/favicon.svg")
@app.get("/favicon.png")
@app.get("/favicon.ico")
def get_favicon():
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "static", "favicon.svg"),
        os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "favicon.svg")
    ]
    for p in paths:
        if os.path.exists(p):
            return FileResponse(p, media_type="image/svg+xml")
    raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/", response_class=HTMLResponse)
def read_index():

    index_path = os.path.join(os.path.dirname(__file__), "..", "static", "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(
            content="<div style='font-family:sans-serif; text-align:center; margin-top:50px;'><h1>SmartStadium Frontend Starting Up...</h1><p>Please refresh in a moment once the static files are generated.</p></div>",
            status_code=200
        )
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def seed_faqs():
    db = next(get_db())
    if db.query(FAQ).count() == 0:
        sample_faqs = [
            FAQ(question="Where is Gate A?", answer="Gate A is situated on the North concourse.", category="navigation"),
            FAQ(question="How do I get emergency support?", answer="Contact nearest security or proceed to Section 110.", category="emergency"),
            FAQ(question="Are there halal food options?", answer="Yes, Section 108 and Section 220 feature Halal dining options.", category="food"),
        ]
        db.add_all(sample_faqs)
        db.commit()

# ==========================================
# MODULE 1: CHATBOT ENDPOINTS
# ==========================================

@app.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def post_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = User(id=payload.user_id, email=f"{payload.user_id}@smartstadium.temp")
        db.add(user)
        db.commit()

    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if not conv:
        conv = Conversation(id=payload.conversation_id, user_id=payload.user_id)
        db.add(conv)
        db.commit()

    user_msg = Message(conversation_id=conv.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    bot_response_text = await ChatbotService.generate_response(db, conv.id, payload.message)

    assistant_msg = Message(conversation_id=conv.id, role="assistant", content=bot_response_text)
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        response=bot_response_text,
        timestamp=datetime.datetime.utcnow()
    )

@app.post("/chat/history", response_model=HistoryResponse, status_code=status.HTTP_200_OK)
def post_chat_history(payload: HistoryRequest, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if not conv:
        return HistoryResponse(conversation_id=payload.conversation_id, history=[])
    
    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    return HistoryResponse(conversation_id=conv.id, history=messages)


@app.get("/faq", response_model=list[FAQResponse])
def get_faq(category: str = None, db: Session = Depends(get_db)):
    query = db.query(FAQ)
    if category:
        query = query.filter(FAQ.category == category.lower())
    return query.all()

# ==========================================
# MODULE 2: ANNOUNCEMENT ENDPOINTS
# ==========================================

@app.post("/announcement/generate", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def generate_announcement(payload: AnnouncementGenerateRequest, db: Session = Depends(get_db)):
    return await AnnouncementService.generate_announcement(db, payload.category, payload.core_details)

@app.post("/announcement/translate", response_model=TranslationResponse, status_code=status.HTTP_200_OK)
async def translate_announcement(payload: AnnouncementTranslateRequest, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == payload.announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement record not found.")
    
    translated_text = await TranslationService.translate_text(announcement.original_text, payload.target_language)
    return TranslationResponse(
        original_text=announcement.original_text,
        translated_text=translated_text,
        target_language=payload.target_language
    )

@app.get("/announcement/history", response_model=list[AnnouncementResponse], status_code=status.HTTP_200_OK)
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

@app.post("/announcement/{announcement_id}/approve", response_model=AnnouncementResponse, status_code=status.HTTP_200_OK)
def approve_announcement(announcement_id: int, payload: AnnouncementApprovalRequest, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    
    announcement.status = payload.status
    if payload.status == "approved":
        announcement.approved_at = datetime.datetime.utcnow()
        
    db.commit()
    db.refresh(announcement)
    return announcement

# ==========================================
# MODULE 3: TRANSLATION ENDPOINTS
# ==========================================

@app.post("/translate/text", response_model=TranslationResponse, status_code=status.HTTP_200_OK)
async def translate_text(payload: TranslationTextRequest):
    translated = await TranslationService.translate_text(payload.text, payload.target_language)
    return TranslationResponse(
        original_text=payload.text,
        translated_text=translated,
        target_language=payload.target_language
    )

@app.post("/translate/speech", response_model=SpeechTranslationResponse, status_code=status.HTTP_200_OK)
async def translate_speech(payload: SpeechTranslationRequest):
    translated_text = await TranslationService.translate_text(payload.text, payload.target_language)
    audio_path = await TranslationService.generate_speech_mock(translated_text, payload.target_language)
    return SpeechTranslationResponse(
        translated_text=translated_text,
        target_language=payload.target_language,
        audio_url=audio_path
    )

# ==========================================
# MODULE 4: MATCH DAY PLANNER ENDPOINTS
# ==========================================

@app.post("/planner/create", response_model=PlannerResponse, status_code=status.HTTP_201_CREATED)
async def create_planner(payload: PlannerCreateRequest, db: Session = Depends(get_db)):
    try:
        plan = await PlannerService.create_plan(
            db,
            user_id=payload.user_id,
            ticket=payload.ticket,
            parking=payload.parking,
            schedule=payload.match_schedule,
            preferences=payload.preferences or {}
        )
        return PlannerResponse(
            planner_id=plan.id,
            user_id=plan.user_id,
            arrival_plan=plan.arrival_plan,
            gate_recommendation=plan.gate_recommendation,
            route=plan.route,
            food_timing=plan.food_timing,
            exit_strategy=plan.exit_strategy,
            updated_at=plan.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assemble match itinerary plan: {str(e)}")

@app.post("/planner/update", response_model=PlannerResponse, status_code=status.HTTP_200_OK)
async def update_planner(payload: PlannerUpdateRequest, db: Session = Depends(get_db)):
    try:
        plan = await PlannerService.update_plan_context(
            db,
            planner_id=payload.planner_id,
            changed_context=payload.changed_context
        )
        return PlannerResponse(
            planner_id=plan.id,
            user_id=plan.user_id,
            arrival_plan=plan.arrival_plan,
            gate_recommendation=plan.gate_recommendation,
            route=plan.route,
            food_timing=plan.food_timing,
            exit_strategy=plan.exit_strategy,
            updated_at=plan.updated_at
        )
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to adjust match itinerary plan: {str(e)}")
