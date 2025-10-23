from sqlalchemy.orm import Session
from app.models import user_model as models
from app.schemas import user_schema as schemas
from typing import List, Optional, Dict, Any

# Nota: O Repositório é agnóstico à Lógica de Negócio e Senhas. 
# Ele apenas mapeia o objeto ORM (models.Usuario) para a Session de DB.

class UserRepository:
    """
    Classe de Repositório: Responsável apenas pela Persistência e 
    acesso direto ao banco de dados (SQLAlchemy).
    """
    
    # 1. Injeta a sessão de DB no construtor
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Usuario

    # -----------------
    # MÉTODOS DE LEITURA (READ)
    # -----------------

    def get_by_id(self, user_id: int) -> Optional[models.Usuario]:
        """ Busca um usuário pelo ID. """
        return self.db.query(self.model).filter(self.model.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[models.Usuario]:
        """ Busca um usuário pelo email. """
        return self.db.query(self.model).filter(self.model.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[models.Usuario]:
        """ Lista todos os usuários. """
        return self.db.query(self.model).offset(skip).limit(limit).all()

    # -----------------
    # MÉTODOS DE ESCRITA (CREATE, UPDATE, DELETE)
    # -----------------

    def create(self, user_data: Dict[str, Any]) -> models.Usuario:
        """ Cria e salva um novo usuário no DB. """
        # user_data já deve ser um dict pronto com 'hashed_password'
        db_user = self.model(**user_data)
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update(self, db_user: models.Usuario, update_data: Dict[str, Any]) -> models.Usuario:
        """ Atualiza um usuário existente (merge de dados). """
        # O db_user é o objeto ORM já carregado.
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
            
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def delete(self, db_user: models.Usuario) -> Dict[str, str]:
        """ Deleta um usuário existente. """
        self.db.delete(db_user)
        self.db.commit()
        return {"message": "Usuário deletado com sucesso"}