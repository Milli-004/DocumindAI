from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables

# import routers (adjust paths if needed)
from api.auth import router as auth_router
from api.documents import router as documents_router
from api.conversations import router as conversations_router

app = FastAPI(title="DocuMind API")

# -----------------------
# CORS SETUP (IMPORTANT)
# -----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # change to frontend domain in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# STARTUP EVENT (CRITICAL FIX)
# -----------------------
@app.on_event("startup")
def startup_event():
    create_tables()
    print("✅ Database tables created / verified successfully")

# -----------------------
# HEALTH CHECK (FOR RENDER)
# -----------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# -----------------------
# ROUTES
# -----------------------
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["Conversations"])
