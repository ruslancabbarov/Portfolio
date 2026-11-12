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


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=300)


@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/debug")
def debug():
    import rag
    return {
        "provider": rag.PROVIDER,
        "model": rag.MODEL,
        "documents_loaded": len(rag.DOCUMENTS),
        "last_error": rag.LAST_ERROR,
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    return {"answer": get_rag_response(req.message.strip())}