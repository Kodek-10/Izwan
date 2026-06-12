from sqlalchemy.orm import Session
from .. import models
import markdown
from xhtml2pdf import pisa
from jinja2 import Template
from datetime import datetime
from io import BytesIO
import os

class ExportService:
    def export_to_markdown(self, db: Session, user_id: int, collection_id: int = None, favorite_only: bool = False) -> str:
        query = db.query(models.Snippet).filter(models.Snippet.owner_id == user_id)
        if collection_id:
            query = query.filter(models.Snippet.collection_id == collection_id)
        if favorite_only:
            query = query.filter(models.Snippet.is_favorite == True)
            
        snippets = query.all()
        md_content = f"# Snippets Export ({datetime.now().strftime('%Y-%m-%d')})\n\n"
        for s in snippets:
            tags_str = ", ".join([t.name for t in s.tags])
            md_content += f"## {s.title}\n"
            md_content += f"- **Language:** {s.language}\n"
            md_content += f"- **Tags:** {tags_str}\n"
            md_content += f"- **Description:** {s.description}\n\n"
            md_content += f"```{s.language}\n{s.code}\n```\n\n"
            md_content += "---\n\n"
        return md_content

    def export_to_pdf(self, db: Session, user_id: int, collection_id: int = None, favorite_only: bool = False) -> BytesIO:
        query = db.query(models.Snippet).filter(models.Snippet.owner_id == user_id)
        if collection_id:
            query = query.filter(models.Snippet.collection_id == collection_id)
        if favorite_only:
            query = query.filter(models.Snippet.is_favorite == True)
            
        snippets = query.all()
        
        # Load template
        template_path = os.path.join(os.path.dirname(__file__), "export_template.html")
        if not os.path.exists(template_path):
            # Fallback inline template if file missing
            template_content = """
            <html>
            <head><style>body { font-family: Helvetica; } .snippet { margin-bottom: 20px; border-bottom: 1px solid #ccc; }</style></head>
            <body>
                <h1>Export Izwa - {{ date }}</h1>
                {% for s in snippets %}
                <div class="snippet">
                    <h2>{{ s.title }} ({{ s.language }})</h2>
                    <p>{{ s.description }}</p>
                    <pre>{{ s.code }}</pre>
                </div>
                {% endfor %}
            </body>
            </html>
            """
        else:
            with open(template_path, "r", encoding="utf-8") as f:
                template_content = f.read()
        
        template = Template(template_content)
        html_out = template.render(
            snippets=snippets,
            date=datetime.now().strftime("%Y-%m-%d %H:%M")
        )
        
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html_out, dest=buffer)
        
        if pisa_status.err:
            raise Exception("Error generating PDF")
            
        buffer.seek(0)
        return buffer

export_service = ExportService()
