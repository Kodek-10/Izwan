from fastembed import TextEmbedding
from typing import List, Optional
import base64
import json
import numpy as np

EMBEDDING_BINARY_PREFIX = "f32:"
DEFAULT_CHUNK_SIZE = 1800
DEFAULT_CHUNK_OVERLAP = 250

class EmbeddingService:
    def __init__(self):
        self.model: Optional[TextEmbedding] = None

    def _get_model(self) -> TextEmbedding:
        if self.model is None:
            # FastEmbed may download the model on first use, so keep backend imports lightweight.
            self.model = TextEmbedding()
        return self.model

    def generate_embedding(self, text: str) -> List[float]:
        # Generate embedding for a single text
        embeddings = list(self._get_model().embed([text]))
        return embeddings[0].tolist()

    def chunk_text(
        self,
        text: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> List[str]:
        normalized = text.strip()
        if not normalized:
            return []
        if len(normalized) <= chunk_size:
            return [normalized]

        chunks: List[str] = []
        start = 0
        while start < len(normalized):
            end = min(start + chunk_size, len(normalized))
            if end < len(normalized):
                newline = normalized.rfind("\n", start, end)
                if newline > start + chunk_size // 2:
                    end = newline

            chunk = normalized[start:end].strip()
            if chunk:
                chunks.append(chunk)

            if end >= len(normalized):
                break
            start = max(end - overlap, start + 1)

        return chunks

    def serialize_embedding(self, vector: List[float]) -> str:
        array = np.asarray(vector, dtype=np.float32)
        encoded = base64.b64encode(array.tobytes()).decode("ascii")
        return f"{EMBEDDING_BINARY_PREFIX}{encoded}"

    def deserialize_embedding(self, value: str) -> List[float]:
        if value.startswith(EMBEDDING_BINARY_PREFIX):
            encoded = value[len(EMBEDDING_BINARY_PREFIX):]
            raw = base64.b64decode(encoded.encode("ascii"))
            return np.frombuffer(raw, dtype=np.float32).astype(float).tolist()

        # Backward compatibility for embeddings already stored as JSON arrays.
        return json.loads(value)

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

embedding_service = EmbeddingService()
