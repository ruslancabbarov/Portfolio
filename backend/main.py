import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import get_rag_response

app = FastAPI(title="Ruslan Portfolio RAG API")

origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class Turn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=600)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=300)
    history: list[Turn] = Field(default_factory=list, max_length=8)


@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/debug")
def debug():
    import rag
    return {
        "provider": rag.PROVIDER,
        "model_in_use": rag.MODEL,
        "candidates": rag.CANDIDATES,
        "dead_models": sorted(rag.DEAD),
        "documents_loaded": len(rag.DOCS),
        "last_error": rag.LAST_ERROR,
    }


@app.get("/debug/models")
def debug_models():
    import rag
    if rag.client is None:
        return {"error": "no API client configured"}
    try:
        ids = sorted(m.id for m in rag.client.models.list().data)
        return {"count": len(ids), "models": ids}
    except Exception as e:
        return {"error": str(e)[:300]}


@app.post("/api/chat")
def chat(req: ChatRequest):
    history = [t.model_dump() for t in req.history]
    return {"answer": get_rag_response(req.message.strip(), history)}