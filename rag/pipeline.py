# rag/pipeline.py
from functools import lru_cache
from typing import Generator
from sqlalchemy.orm import Session
from db.models import Document, Message
from rag.chunker import process_pdf
from rag.embedder import embed_texts, embed_query
from rag.vector_store import store_chunks, search_similar_chunks
from config import get_settings
from groq import Groq

settings = get_settings()

@lru_cache(maxsize=1)
def get_groq_client() -> Groq:
    return Groq(api_key=settings.GROQ_API_KEY)


def ingest_document(file_bytes: bytes, document_id: str, db: Session) -> int:
    chunks = process_pdf(file_bytes)
    if not chunks:
        raise ValueError("No text could be extracted from this PDF")
    embeddings = embed_texts(chunks)
    chunk_count = store_chunks(document_id, chunks, embeddings)
    document = db.query(Document).filter(Document.id == document_id).first()
    document.chunk_count = chunk_count
    document.is_processed = True
    db.commit()
    return chunk_count


def query_document(question: str, document_id: str, conversation_id: str, db: Session) -> str:
    query_embedding = embed_query(question)
    relevant_chunks = search_similar_chunks(document_id, query_embedding, n_results=5)
    if not relevant_chunks:
        return "I could not find relevant information in the document to answer your question."

    context = "\n\n".join(relevant_chunks)
    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(6)
        .all()
    )
    recent_messages.reverse()
    history = [{"role": msg.role, "content": msg.content} for msg in recent_messages]

    system_prompt = """You are a helpful assistant that answers questions based on the provided document context.

Rules:
- Only answer based on the context provided
- If the answer is not in the context, say "I cannot find this information in the document"
- Be concise and accurate
- Always cite which part of the document supports your answer"""

    user_message = f"Context from document:\n{context}\n\nQuestion: {question}"
    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": user_message}
        ],
        temperature=0.3,
        max_tokens=1024,
    )
    answer = response.choices[0].message.content

    db.add(Message(conversation_id=conversation_id, role="user", content=question))
    db.add(Message(conversation_id=conversation_id, role="assistant", content=answer))
    db.commit()
    return answer


def query_document_stream(
    question: str, document_id: str, conversation_id: str, db: Session
) -> Generator[str, None, None]:
    query_embedding = embed_query(question)
    relevant_chunks = search_similar_chunks(document_id, query_embedding, n_results=5)
    if not relevant_chunks:
        yield "I could not find relevant information in the document to answer your question."
        return

    context = "\n\n".join(relevant_chunks)
    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(6)
        .all()
    )
    recent_messages.reverse()
    history = [{"role": msg.role, "content": msg.content} for msg in recent_messages]

    system_prompt = """You are a helpful assistant that answers questions based on the provided document context.

Rules:
- Only answer based on the context provided
- If the answer is not in the context, say "I cannot find this information in the document"
- Be concise and accurate
- Always cite which part of the document supports your answer"""

    user_message = f"Context from document:\n{context}\n\nQuestion: {question}"

    db.add(Message(conversation_id=conversation_id, role="user", content=question))
    db.commit()

    client = get_groq_client()
    stream = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": user_message}
        ],
        temperature=0.3,
        max_tokens=1024,
        stream=True
    )

    full_answer = ""
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            full_answer += delta
            yield delta

    db.add(Message(conversation_id=conversation_id, role="assistant", content=full_answer))
    db.commit()
