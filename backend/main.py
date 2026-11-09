import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import PortfolioRAG

app = FastAPI(title="Ruslan Portfolio RAG API")

origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

rag = PortfolioRAG()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=300)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(req: ChatRequest):
    return rag.answer(req.message.strip())