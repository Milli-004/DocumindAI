from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from database import create_tables
from api.auth import router as auth_router
from api.documents import router as documents_router
from api.chat import router as chat_router

app = FastAPI(
    title="DocuMind API",
    description="RAG-powered document Q&A system",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://documind-ai-dun.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{full_path:path}")
def preflight_handler(full_path: str):
    return Response(status_code=200)

# Routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)

@app.on_event("startup")
def startup():
    try:
        create_tables()
        print("Database tables ready")
    except Exception as e:
        print("Startup error:", e)

# Health check
@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "healthy", "service": "DocuMind API"}
