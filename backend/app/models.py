import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .core.database import Base


class UserRole(str, enum.Enum):
    """Rôles applicatifs. Stockés en base comme une simple chaîne (voir User.role)."""
    USER = "USER"
    ADMIN = "ADMIN"

# Association table for Snippets and Tags
snippet_tags = Table(
    "snippet_tags",
    Base.metadata,
    Column("snippet_id", Integer, ForeignKey("snippets.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(
        String,
        nullable=False,
        default=UserRole.USER.value,
        server_default=UserRole.USER.value,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    snippets = relationship("Snippet", back_populates="owner")
    collections = relationship("Collection", back_populates="owner")

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    icon = Column(String) # For UI customization
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="collections")
    snippets = relationship("Snippet", back_populates="collection_ref")

class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    language = Column(String, index=True, nullable=False)
    code = Column(Text, nullable=False)
    description = Column(Text)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)

    owner = relationship("User", back_populates="snippets")
    collection_ref = relationship("Collection", back_populates="snippets")
    tags = relationship("Tag", secondary=snippet_tags, back_populates="snippets")
    embedding = relationship("SnippetEmbedding", back_populates="snippet", uselist=False, cascade="all, delete-orphan")
    embedding_chunks = relationship("SnippetEmbeddingChunk", back_populates="snippet", cascade="all, delete-orphan")

class SnippetEmbedding(Base):
    __tablename__ = "snippet_embeddings"

    snippet_id = Column(Integer, ForeignKey("snippets.id", ondelete="CASCADE"), primary_key=True)
    vector = Column(Text, nullable=False) # Store as JSON string of floats

    snippet = relationship("Snippet", back_populates="embedding")

class SnippetEmbeddingChunk(Base):
    __tablename__ = "snippet_embedding_chunks"

    id = Column(Integer, primary_key=True, index=True)
    snippet_id = Column(Integer, ForeignKey("snippets.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    vector = Column(Text, nullable=False)

    snippet = relationship("Snippet", back_populates="embedding_chunks")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    snippets = relationship("Snippet", secondary=snippet_tags, back_populates="tags")


class AiUsage(Base):
    """Journal des appels aux fonctions IA (pour les métriques admin)."""
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String, index=True, nullable=False)  # enrich, explain, chat, adapt, translate
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class AuditLog(Base):
    """Journal d'audit des actions sensibles (sécurité / traçabilité)."""
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True, nullable=False)  # admin | auth | system
    action = Column(String, nullable=False)
    actor = Column(String, index=True, nullable=True)   # username (instantané)
    target = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
