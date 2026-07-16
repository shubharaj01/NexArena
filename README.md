# NexArena — SmartStadium AI

An AI-integrated stadium management platform built for the FIFA World Cup 2026, combining
crowd-navigation assistance, multilingual safety communication, and match-day logistics
planning for both fans and stadium staff.

## AI Modules

| # | Module | What it does | Backend | Frontend |
|---|--------|---------------|---------|----------|
| 1 | **Stadium Chatbot** | RAG-backed Q&A for navigation, ticketing, food, and emergency info | `app/chatbot_service.py`, `app/rag_service.py` | Customer Dashboard chat panel |
| 2 | **Announcement Generator** | Drafts calm, professional public-safety announcements from raw incident details, with an admin approval step | `app/announcement_service.py` | Admin Dashboard |
| 3 | **Multilingual Translation** | Translates announcements and stadium phrases across 8 languages (text + mock speech) | `app/translation_service.py` | Language selector, Admin broadcast tools |
| 4 | **Match Day Planner** | Generates and re-optimizes a personalized arrival/parking/food/exit plan per fan, adjusting to live situational changes (e.g. traffic delays) | `app/planner_service.py` | Customer Dashboard planner |

Every module works fully offline out of the box (deterministic fallback responses), and
upgrades automatically to live OpenAI-generated responses when `OPENAI_API_KEY` is set.

## Project Structure

```
nexarena/
├── app/            # FastAPI backend (API, services, models)
├── frontend/        # React + TypeScript + Vite source (Customer & Admin dashboards)
├── static/          # Built frontend assets served by the FastAPI app
└── tests/            # Automated backend test suite (pytest)
```

## Running the backend

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set `OPENAI_API_KEY` in your environment (or a `.env` file) to enable live AI-generated
responses; without it, the app uses its built-in offline fallbacks so it still runs end to
end.

## Running the tests

```bash
pip install -r requirements-dev.txt
pytest
```

The test suite spins up the API against an isolated, disposable SQLite database and never
calls out to OpenAI, so it runs the same way locally and in CI.

## Accessibility

The frontend uses semantic landmarks (`header`/`main`/`footer`), associates every form
label with its input via `htmlFor`/`id`, and provides `aria-label`s and keyboard support
(Enter/Space activation, focus rings) for icon-only controls and the interactive seat map.
