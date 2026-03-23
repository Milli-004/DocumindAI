# rag/vector_store.py
import chromadb
from chromadb.config import Settings
from functools import lru_cache
import os


@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.Client:
    chroma_path = os.getenv("CHROMA_PATH", ".chroma")
    return chromadb.PersistentClient(
        path=chroma_path,
        settings=Settings(anonymized_telemetry=False)
    )


def get_or_create_collection(document_id: str) -> chromadb.Collection:
    client = get_chroma_client()
    collection_name = f"doc_{document_id.replace('-', '_')}"
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )


def store_chunks(document_id: str, chunks: list[str], embeddings: list[list[float]]) -> int:
    collection = get_or_create_collection(document_id)
    ids = [f"chunk_{document_id}_{i}" for i in range(len(chunks))]
    collection.add(ids=ids, embeddings=embeddings, documents=chunks)
    return len(chunks)


def search_similar_chunks(document_id: str, query_embedding: list[float], n_results: int = 5) -> list[str]:
    collection = get_or_create_collection(document_id)
    count = collection.count()
    if count == 0:
        return []
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, count)
    )
    return results["documents"][0]


def delete_document_collection(document_id: str) -> None:
    client = get_chroma_client()
    collection_name = f"doc_{document_id.replace('-', '_')}"
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass
