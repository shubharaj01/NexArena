"""
Minimal automated test suite for the SmartStadium API.

Covers a happy-path and at least one edge case for each of the four
modules described in app/main.py, using FastAPI's TestClient against an
isolated, disposable SQLite database (see conftest.py). No network access
or OpenAI API key is required to run these tests.
"""
import uuid


# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------

def test_read_root_serves_html(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# MODULE 1: Chatbot
# ---------------------------------------------------------------------------

def test_faq_seeded_on_startup(client):
    response = client.get("/faq")
    assert response.status_code == 200
    faqs = response.json()
    assert len(faqs) >= 3
    assert any("Gate A" in f["question"] for f in faqs)


def test_faq_filtered_by_category(client):
    response = client.get("/faq", params={"category": "navigation"})
    assert response.status_code == 200
    faqs = response.json()
    assert len(faqs) >= 1
    assert all(f["category"] == "navigation" for f in faqs)


def test_chat_greeting_fallback(client):
    payload = {
        "user_id": "test_user",
        "conversation_id": f"conv_{uuid.uuid4().hex[:8]}",
        "message": "hello",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == payload["conversation_id"]
    assert "welcome to nexarena" in data["response"].lower()


def test_chat_history_round_trip(client):
    conv_id = f"conv_{uuid.uuid4().hex[:8]}"
    client.post("/chat", json={"user_id": "history_user", "conversation_id": conv_id, "message": "hi"})

    response = client.post("/chat/history", json={"conversation_id": conv_id})
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == conv_id
    assert len(data["history"]) == 2  # user message + assistant reply
    assert data["history"][0]["role"] == "user"
    assert data["history"][1]["role"] == "assistant"


def test_chat_history_unknown_conversation_returns_empty(client):
    response = client.post("/chat/history", json={"conversation_id": "does-not-exist"})
    assert response.status_code == 200
    assert response.json()["history"] == []


# ---------------------------------------------------------------------------
# MODULE 2: Announcements
# ---------------------------------------------------------------------------

def test_announcement_generate_and_history(client):
    response = client.post(
        "/announcement/generate",
        json={"category": "weather", "core_details": "Heavy rain expected after halftime."},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert "WEATHER" in data["original_text"]

    history_response = client.get("/announcement/history")
    assert history_response.status_code == 200
    assert any(a["id"] == data["id"] for a in history_response.json())


def test_announcement_approve(client):
    create_response = client.post(
        "/announcement/generate",
        json={"category": "security", "core_details": "Additional bag checks at Gate C."},
    )
    announcement_id = create_response.json()["id"]

    approve_response = client.post(f"/announcement/{announcement_id}/approve", json={"status": "approved"})
    assert approve_response.status_code == 200
    data = approve_response.json()
    assert data["status"] == "approved"
    assert data["approved_at"] is not None


def test_announcement_approve_missing_returns_404(client):
    response = client.post("/announcement/999999/approve", json={"status": "approved"})
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# MODULE 3: Translation
# ---------------------------------------------------------------------------

def test_translate_text_known_phrase(client):
    response = client.post(
        "/translate/text",
        json={"text": "Where is Gate A?", "target_language": "Spanish"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_language"] == "Spanish"
    assert data["translated_text"] == "\u00bfD\u00f3nde est\u00e1 la puerta A?"


def test_translate_speech_returns_audio_url(client):
    response = client.post(
        "/translate/speech",
        json={"text": "Please remain calm.", "target_language": "French"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["audio_url"].startswith("https://cdn.smartstadium.ai/audio/translations/")


# ---------------------------------------------------------------------------
# MODULE 4: Match Day Planner
# ---------------------------------------------------------------------------

def test_planner_create_and_update(client):
    create_response = client.post(
        "/planner/create",
        json={
            "user_id": "planner_user",
            "ticket": {"gate": "Gate A", "section": "104", "row": "12", "seat": "15"},
            "parking": "Lot West C",
            "match_schedule": {"kickoff_time": "18:00", "gates_open": "15:00"},
            "preferences": {"food_preference": "vegetarian"},
        },
    )
    assert create_response.status_code == 201
    plan = create_response.json()
    assert plan["gate_recommendation"] == "Gate A"
    assert plan["arrival_plan"] == "Arrive 2 hours prior to kickoff."

    update_response = client.post(
        "/planner/update",
        json={
            "planner_id": plan["planner_id"],
            "changed_context": "I am arriving 30 minutes late due to traffic.",
        },
    )
    assert update_response.status_code == 200
    updated_plan = update_response.json()
    assert updated_plan["planner_id"] == plan["planner_id"]
    # Without a configured AI provider, the deterministic fallback plan is preserved.
    assert updated_plan["arrival_plan"] == plan["arrival_plan"]


def test_planner_update_unknown_id_returns_404(client):
    response = client.post(
        "/planner/update",
        json={"planner_id": "does-not-exist", "changed_context": "test"},
    )
    assert response.status_code == 404
