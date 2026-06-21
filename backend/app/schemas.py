from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str = "USER"
    model_config = ConfigDict(from_attributes=True)

class RoleUpdate(BaseModel):
    role: str

class AdminStats(BaseModel):
    total_users: int
    total_admins: int
    total_snippets: int
    total_collections: int
    snippets_by_language: Dict[str, int]

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
    title: str
    language: str
    code: str
    description: Optional[str] = None
    is_favorite: bool = False
    collection_id: Optional[int] = None

class SnippetCreate(SnippetBase):
    tags: List[str] = []

class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
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
