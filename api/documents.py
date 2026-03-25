import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, SessionLocal
from db.models import Document, User
from core.dependencies import get_current_user
from rag.pipeline import ingest_document
from rag.vector_store import delete_document_collection

router = APIRouter(tags=["documents"])


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size: int
    chunk_count: int
    is_processed: bool
    class Config:
        from_attributes = True


def _run_ingestion(file_bytes: bytes, document_id: str) -> None:
    """Background task: ingest document into vector store."""
    db = SessionLocal()
    try:
        ingest_document(file_bytes, document_id, db)
    except Exception as exc:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.is_processed = False
            db.commit()
        print(f"[ingestion error] document {document_id}: {exc}")
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must be less than 10MB")

    document_id = str(uuid.uuid4())
    document = Document(
        id=document_id,
        filename=f"{document_id}.pdf",
        original_name=file.filename,
        file_size=len(file_bytes),
        owner_id=current_user.id,
        is_processed=False,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Use BackgroundTasks instead of deprecated get_event_loop() + ThreadPoolExecutor
    background_tasks.add_task(_run_ingestion, file_bytes, document_id)

    return document


@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return documents


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    delete_document_collection(document_id)
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}
