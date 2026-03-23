# rag/embedder.py
from sentence_transformers import SentenceTransformer
from functools import lru_cache
import numpy as np

@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Embedding model loaded!")
    return model

def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True
    )
    return embeddings.tolist()

def embed_query(query: str) -> list[float]:
    model = get_embedding_model()
    embedding = model.encode(
        query,
        convert_to_numpy=True,
        normalize_embeddings=True
    )
    return embedding.tolist()
