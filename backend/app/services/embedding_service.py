from fastembed import TextEmbedding
from typing import List
import json
import numpy as np

class EmbeddingService:
    def __init__(self):
        # This will download the model on first init
        self.model = TextEmbedding()

    def generate_embedding(self, text: str) -> List[float]:
        # Generate embedding for a single text
        embeddings = list(self.model.embed([text]))
        return embeddings[0].tolist()

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

embedding_service = EmbeddingService()
