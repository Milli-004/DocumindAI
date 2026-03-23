# run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="warning"
    )
```

**`requirements.txt`**
```
# Web framework
fastapi==0.115.0
uvicorn[standard]==0.30.6

# Database
sqlalchemy==2.0.36
psycopg2-binary==2.9.9
alembic==1.13.3

# Auth & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
bcrypt==4.0.1

# Config
pydantic[email]==2.7.4
pydantic-settings==2.3.4
python-dotenv==1.0.1

# RAG
sentence-transformers==2.7.0
chromadb==0.4.15
pypdf==4.3.1

# LLM
groq==0.13.0
httpx==0.27.2

# Utilities
numpy==1.26.4
