import json

import numpy as np

from backend.app.services.embedding_service import EMBEDDING_BINARY_PREFIX, EmbeddingService


def test_embedding_serialization_roundtrip_uses_compact_format():
    service = EmbeddingService()
    vector = [0.1, -0.25, 1.5]

    serialized = service.serialize_embedding(vector)
    restored = service.deserialize_embedding(serialized)

    assert serialized.startswith(EMBEDDING_BINARY_PREFIX)
    assert np.allclose(restored, vector, rtol=1e-6)


def test_embedding_deserialization_supports_legacy_json_vectors():
    service = EmbeddingService()
    vector = [0.1, -0.25, 1.5]

    restored = service.deserialize_embedding(json.dumps(vector))

    assert restored == vector


def test_chunk_text_splits_long_content_with_overlap():
    service = EmbeddingService()
    text = "\n".join(f"line {i}" for i in range(100))

    chunks = service.chunk_text(text, chunk_size=120, overlap=20)

    assert len(chunks) > 1
    assert chunks[0].startswith("line 0")
    assert "line 99" in chunks[-1]
