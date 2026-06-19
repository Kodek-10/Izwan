from fastembed import TextEmbedding
from typing import List, Optional
import numpy as np

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

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

embedding_service = EmbeddingService()
