from app.core.database import SessionLocal
from app.models import User, Snippet
import traceback
from pydantic import ValidationError
from app.schemas import PaginatedSnippet, Snippet as SnippetSchema

db = SessionLocal()
users = db.query(User).all()
print(f"Users: {len(users)}")
for u in users:
    print(f"User: {u.username} (id={u.id})")

snippets = db.query(Snippet).all()
print(f"Snippets: {len(snippets)}")
for s in snippets:
    try:
        # try to validate
        SnippetSchema.model_validate(s)
    except Exception as e:
        print(f"Snippet {s.id} validation failed:")
        traceback.print_exc()
