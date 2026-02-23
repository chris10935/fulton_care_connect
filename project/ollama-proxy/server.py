"""
Fulton Care Connect – Chat API Server
--------------------------------------
A FastAPI server that:
  1. Searches a local CSV of Fulton County resources
  2. Enriches conversation context with matching resources
  3. Forwards the chat to the Groq API (Llama 3 70B)

Environment variables (set on Render / .env):
  GROQ_API_KEY   – required, your Groq Cloud API key
  PORT           – optional, defaults to 10000 (Render default)

Usage (local dev):
  pip install fastapi uvicorn httpx
  GROQ_API_KEY=gsk_... uvicorn server:app --host 0.0.0.0 --port 8001 --reload
"""

from __future__ import annotations

import csv
import os
import re
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

app = FastAPI(title="Fulton Care Connect Chat API")

# ---------------------------------------------------------------------------
# Load CSV resource directory at startup
# ---------------------------------------------------------------------------
CSV_PATH = Path(__file__).resolve().parent / "data" / "resources_rows.csv"

# Each resource stored as a dict for keyword matching
RESOURCES: list[dict[str, str]] = []

def _load_resources() -> None:
    """Parse the CSV into a list of resource dicts."""
    if not CSV_PATH.exists():
        print(f"[startup] CSV not found at {CSV_PATH}")
        return
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            RESOURCES.append({k: (v or "").strip().replace("\n", ", ") for k, v in row.items()})
    print(f"[startup] Loaded {len(RESOURCES)} resources from CSV")

_load_resources()


# ---- simple keyword search ------------------------------------------------

# Map common user terms to categories / keywords so searches are broader
_CATEGORY_ALIASES: dict[str, list[str]] = {
    "homeless": ["housing", "shelter", "homeless"],
    "shelter": ["housing", "shelter", "homeless"],
    "housing": ["housing", "shelter", "rent", "voucher"],
    "food": ["food", "pantry", "grocery", "meal", "snap", "hunger"],
    "hungry": ["food", "pantry", "grocery", "meal", "snap"],
    "mental": ["mental health", "counseling", "behavioral", "crisis", "therapy"],
    "therapy": ["mental health", "counseling", "therapy"],
    "counseling": ["mental health", "counseling", "therapy"],
    "crisis": ["mental health", "crisis", "988"],
    "legal": ["legal", "lawyer", "attorney", "court"],
    "lawyer": ["legal", "lawyer", "attorney"],
    "job": ["employment", "career", "job", "workforce", "training"],
    "employment": ["employment", "career", "job", "workforce"],
    "work": ["employment", "career", "job", "workforce"],
    "health": ["healthcare", "health", "medical", "clinic", "dental"],
    "medical": ["healthcare", "health", "medical", "clinic"],
    "doctor": ["healthcare", "health", "medical", "clinic"],
    "dental": ["healthcare", "dental", "dentist"],
    "transport": ["transportation", "marta", "ride"],
    "ride": ["transportation", "marta", "ride"],
    "youth": ["youth", "teen", "adolescent", "child"],
    "teen": ["youth", "teen", "adolescent"],
    "child": ["youth", "child", "foster", "daycare"],
    "utility": ["utilities", "energy", "water", "liheap"],
    "bill": ["utilities", "energy", "water", "financial", "assistance"],
    "financial": ["financial", "money", "assistance", "rent"],
    "education": ["education", "ged", "school", "literacy"],
}

def _score_resource(resource: dict[str, str], query_words: list[str], expanded: list[str]) -> int:
    """Return a relevance score for a resource given the user query."""
    searchable = " ".join([
        resource.get("name", ""),
        resource.get("category", ""),
        resource.get("services", ""),
        resource.get("eligibility", ""),
        resource.get("city", ""),
        resource.get("zip_code", ""),
    ]).lower()

    score = 0
    for word in expanded:
        if word in searchable:
            score += 3
    for word in query_words:
        if word in searchable:
            score += 2
    return score


def _truncate(text: str, max_len: int = 80) -> str:
    """Truncate long text to keep context compact."""
    text = text.strip()
    return text[:max_len] + "…" if len(text) > max_len else text


def search_resources(user_message: str, zip_code: str | None = None, limit: int = 8) -> str:
    """Return a compact formatted string of the top matching resources."""
    words = [w.lower() for w in user_message.split() if len(w) > 2]

    # Expand search terms using aliases
    expanded: list[str] = []
    for w in words:
        if w in _CATEGORY_ALIASES:
            expanded.extend(_CATEGORY_ALIASES[w])

    # If no meaningful keywords found, return empty (let LLM respond naturally)
    if not words and not expanded:
        return ""

    scored: list[tuple[int, dict[str, str]]] = []
    for r in RESOURCES:
        s = _score_resource(r, words, expanded)
        if zip_code and r.get("zip_code", "").strip() == zip_code:
            s += 5
        if s > 0:
            scored.append((s, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    if not top:
        return ""

    lines: list[str] = []
    for i, (_, r) in enumerate(top, 1):
        lines.append(
            f"{i}. {r.get('name','')} | {r.get('category','')} | "
            f"Phone: {r.get('phone','N/A')} | "
            f"{r.get('address','')}, {r.get('city','')} {r.get('zip_code','')} | "
            f"Services: {_truncate(r.get('services',''))} | "
            f"Hours: {r.get('hours','N/A')}"
        )
    return "\n".join(lines)

# Allow the Vite dev server (and any local origin) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = GROQ_MODEL
    messages: list[ChatMessage]

class ChatReply(BaseModel):
    reply: str

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatReply)
async def chat(req: ChatRequest):
    """
    Forwards the conversation to the Groq API (OpenAI-compatible)
    and returns the assistant's reply as { "reply": "..." }.

    Automatically searches the CSV resource directory for relevant
    resources and injects them into the system context.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not set.",
        )

    # Extract the latest user message for keyword search
    user_query = ""
    zip_code = None
    for m in reversed(req.messages):
        if m.role == "user":
            user_query = m.content
            zip_match = re.search(r'\b(3\d{4})\b', user_query)
            if zip_match:
                zip_code = zip_match.group(1)
            break

    # Search for relevant resources (returns empty string for greetings)
    resource_context = search_resources(user_query, zip_code)

    # Inject resource context into the first system message (if present)
    # or prepend a new system message with the directory.
    enriched_messages: list[dict[str, str]] = []
    injected = False

    for m in req.messages:
        msg = m.model_dump()
        if msg["role"] == "system" and not injected:
            msg["content"] = (
                msg["content"]
                + "\n\n--- Matching resources from our Fulton County directory ---\n"
                + resource_context
            )
            injected = True
        enriched_messages.append(msg)

    # If there was no system message at all, prepend one
    if not injected and resource_context:
        enriched_messages.insert(0, {
            "role": "system",
            "content": (
                "You are Fulton Care Connect AI. You help Fulton County, Georgia residents "
                "find community resources. Below are matching resources from our directory. "
                "Use them to give specific, accurate recommendations with real names, addresses, "
                "and phone numbers. Never fabricate information.\n\n"
                + resource_context
            ),
        })

    payload: dict[str, Any] = {
        "model": req.model,
        "messages": enriched_messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(GROQ_CHAT_URL, json=payload, headers=headers)
            resp.raise_for_status()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail="Cannot reach the Groq API. Please try again later.",
        )
    except httpx.ReadTimeout:
        raise HTTPException(
            status_code=504,
            detail="Groq API took too long to respond. Please try again.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Groq returned {exc.response.status_code}: {exc.response.text[:300]}",
        )

    data = resp.json()
    choices = data.get("choices", [])
    reply_text = choices[0]["message"]["content"] if choices else ""
    if not reply_text:
        reply_text = "I'm sorry, I couldn't generate a response. Please try again."

    return ChatReply(reply=reply_text)
