"""
Importa todos os modelos na ordem correta para o SQLAlchemy resolver
relationships por string (evita InvalidRequestError em runtime).

Use: `import app.models` no arranque da aplicação (ver main.py).
"""

from app.models import legal_organization_model  # noqa: F401
from app.models import organization_model  # noqa: F401
from app.models import department_model  # noqa: F401
from app.models import secretary_model  # noqa: F401 — antes de executive (secretary_executives)
from app.models import executive_model  # noqa: F401
from app.models import user_model  # noqa: F401
from app.models import user_invite_token_model  # noqa: F401 — após user (FK users)
from app.models import event_type_model  # noqa: F401
from app.models import event_model  # noqa: F401
from app.models import document_category_model  # noqa: F401
from app.models import document_model  # noqa: F401
from app.models import contact_type_model  # noqa: F401
from app.models import contact_model  # noqa: F401
from app.models import task_model  # noqa: F401
from app.models import report_model  # noqa: F401
from app.models import settings_backup_model  # noqa: F401
