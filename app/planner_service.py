import os
import uuid
import json
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models import MatchPlan

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

class PlannerService:
    @staticmethod
    async def create_plan(db: Session, user_id: str, ticket: dict, parking: str, schedule: dict, preferences: dict) -> MatchPlan:
        plan_id = f"plan_{uuid.uuid4().hex[:8]}"
        
        system_instruction = (
            "You are a stadium logistics optimizer AI. Analyze a fan's parameters to generate a match day plan. "
            "Respond in a raw JSON format with 5 string values matching these specific keys: "
            "'arrival_plan', 'gate_recommendation', 'route', 'food_timing', 'exit_strategy'."
        )

        user_input_summary = {
            "ticket": ticket,
            "parking": parking,
            "match_schedule": schedule,
            "preferences": preferences
        }

        arrival_plan = "Arrive 2 hours prior to kickoff."
        gate_recommendation = ticket.get("gate", "Main Entrance Gate")
        route = f"From parking spot {parking or 'unassigned'}, navigate toward the nearest ticketing gate."
        food_timing = "We recommend food ordering 45 minutes prior to kickoff to bypass queues."
        exit_strategy = "Proceed to the nearest exit immediately after final whistle."

        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": json.dumps(user_input_summary)}
                    ],
                    max_tokens=600,
                    temperature=0.3,
                    timeout=3.0
                )
                generated_json = json.loads(response.choices[0].message.content)
                arrival_plan = generated_json.get("arrival_plan", arrival_plan)
                gate_recommendation = generated_json.get("gate_recommendation", gate_recommendation)
                route = generated_json.get("route", route)
                food_timing = generated_json.get("food_timing", food_timing)
                exit_strategy = generated_json.get("exit_strategy", exit_strategy)
            except Exception:
                pass

        db_plan = MatchPlan(
            id=plan_id,
            user_id=user_id,
            ticket_details=ticket,
            parking_spot=parking,
            match_schedule=schedule,
            preferences=preferences,
            arrival_plan=arrival_plan,
            gate_recommendation=gate_recommendation,
            route=route,
            food_timing=food_timing,
            exit_strategy=exit_strategy
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    async def update_plan_context(db: Session, planner_id: str, changed_context: str) -> MatchPlan:
        db_plan = db.query(MatchPlan).filter(MatchPlan.id == planner_id).first()
        if not db_plan:
            raise ValueError("Planner session not found.")

        system_instruction = (
            "You are an active match day itinerary updater. Update the existing plan based on situational changes. "
            "Respond in a raw JSON format with 5 string values matching these specific keys: "
            "'arrival_plan', 'gate_recommendation', 'route', 'food_timing', 'exit_strategy'."
        )

        user_input_summary = {
            "ticket": db_plan.ticket_details,
            "parking": db_plan.parking_spot,
            "match_schedule": db_plan.match_schedule,
            "preferences": db_plan.preferences,
            "previous_arrival_plan": db_plan.arrival_plan,
            "situational_change": changed_context
        }

        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": json.dumps(user_input_summary)}
                    ],
                    max_tokens=600,
                    temperature=0.3,
                    timeout=3.0
                )
                generated_json = json.loads(response.choices[0].message.content)
                db_plan.arrival_plan = generated_json.get("arrival_plan", db_plan.arrival_plan)
                db_plan.gate_recommendation = generated_json.get("gate_recommendation", db_plan.gate_recommendation)
                db_plan.route = generated_json.get("route", db_plan.route)
                db_plan.food_timing = generated_json.get("food_timing", db_plan.food_timing)
                db_plan.exit_strategy = generated_json.get("exit_strategy", db_plan.exit_strategy)
            except Exception:
                db_plan.arrival_plan = f"[Delayed Status Update] {db_plan.arrival_plan}"

        db.commit()
        db.refresh(db_plan)
        return db_plan
