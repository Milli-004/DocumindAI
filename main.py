from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routers
from api.auth_routes import router as auth_router
from api.chat import router as chat_router
from api.documents import router as documents_router  # if you have it

app = FastAPI(title="Synapse AI Backend")

# CORS (important for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check (IMPORTANT for Render)
@app.get("/")
def root():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
