from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional, Dict
from datetime import datetime

# Bornes anti-DoS (CWE-770/400) : validation serveur avant tout appel DB/IA/embedding.
MAX_TITLE_LEN = 200
MAX_LANGUAGE_LEN = 50
MAX_DESCRIPTION_LEN = 5_000
MAX_CODE_LEN = 500_000  # ~500 Ko ; au-dela = payload abusive

class UserBase(BaseModel):
    username: str
    email: EmailStr
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    display_name: Optional[str] = None

class User(UserBase):
    id: int
    role: str = "USER"
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class RoleUpdate(BaseModel):
    role: str

class AdminStats(BaseModel):
    total_users: int
    total_admins: int
    total_snippets: int
    total_collections: int
    snippets_by_language: Dict[str, int]

class RoleCapability(BaseModel):
    key: str
    label: str
    roles: Dict[str, bool]

class RolesMatrix(BaseModel):
    roles: List[str]
    capabilities: List[RoleCapability]

class AiUsageDay(BaseModel):
    date: str
    count: int

class AiUsageStats(BaseModel):
    days: int
    total: int
    by_feature: Dict[str, int]
    by_day: List[AiUsageDay] = []

class AuditEntry(BaseModel):
    id: int
    category: str
    action: str
    actor: Optional[str] = None
    target: Optional[str] = None
    detail: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    username: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None

class Collection(CollectionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SnippetBase(BaseModel):
    title: str = Field(max_length=MAX_TITLE_LEN)
    language: str = Field(max_length=MAX_LANGUAGE_LEN)
    code: str = Field(max_length=MAX_CODE_LEN)
    description: Optional[str] = Field(default=None, max_length=MAX_DESCRIPTION_LEN)
    is_favorite: bool = False
    collection_id: Optional[int] = None

class SnippetCreate(SnippetBase):
    tags: List[str] = []

class SnippetUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=MAX_TITLE_LEN)
    language: Optional[str] = Field(default=None, max_length=MAX_LANGUAGE_LEN)
    code: Optional[str] = Field(default=None, max_length=MAX_CODE_LEN)
    description: Optional[str] = Field(default=None, max_length=MAX_DESCRIPTION_LEN)
    is_favorite: Optional[bool] = None
    collection_id: Optional[int] = None
    tags: Optional[List[str]] = None

class Snippet(SnippetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    tags: List[Tag] = []
    collection_ref: Optional[Collection] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedSnippet(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[Snippet]

class GraphNode(BaseModel):
    id: int
    title: str
    language: str

class GraphLink(BaseModel):
    source: int
    target: int
    score: float
    duplicate: bool = False

class SnippetGraph(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

class AdminSnippet(BaseModel):
    """Métadonnées d'un snippet pour l'admin — JAMAIS le code (confidentialité)."""
    id: int
    title: str
    language: str
    owner: Optional[str] = None
    tags: List[str] = []
    created_at: Optional[datetime] = None
