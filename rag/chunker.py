from pypdf import PdfReader
import io
import re


def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_file = io.BytesIO(file_bytes)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Sentence-aware chunker: splits on sentence boundaries so chunks never
    cut a sentence mid-word, which preserves embedding quality.
    """
    if not text:
        return []

    sentence_endings = re.compile(r'(?<=[.!?])\s+')
    sentences = sentence_endings.split(text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks: list[str] = []
    current_chars = 0
    current: list[str] = []

    for sentence in sentences:
        if current and current_chars + len(sentence) + 1 > chunk_size:
            chunk_text_str = " ".join(current).strip()
            if chunk_text_str:
                chunks.append(chunk_text_str)
            overlap_sents: list[str] = []
            overlap_chars = 0
            for sent in reversed(current):
                if overlap_chars + len(sent) + 1 <= overlap:
                    overlap_sents.insert(0, sent)
                    overlap_chars += len(sent) + 1
                else:
                    break
            current = overlap_sents
            current_chars = overlap_chars

        current.append(sentence)
        current_chars += len(sentence) + 1

    if current:
        chunk_text_str = " ".join(current).strip()
        if chunk_text_str:
            chunks.append(chunk_text_str)

    return chunks


def process_pdf(file_bytes: bytes) -> list[str]:
    text = extract_text_from_pdf(file_bytes)
    chunks = chunk_text(text)
    return chunks
