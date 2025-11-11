from sqlalchemy.orm import Session
from fastapi import Depends
from passlib.context import CryptContext
from app.repositories.user_repository import UserRepository
from app.schemas import user_schema as schemas
from app.models import user_model as models
from app.core.database import get_db
from typing import Optional, List

# Contexto para hash de senha (Mantido como utilidade fora da classe)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# A função verify_password não é usada no CRUD de criação, mas é útil
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)


class UserService:
    """
    Classe de Serviço: Responsável pela Lógica de Negócio do domínio Usuário.
    A sessão do DB é injetada no construtor.
    """
    
    # Injeção de Dependência da Sessão
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        # O Repositório é acessado via classe ou pode ser injetado aqui
        self.repository = UserRepository(db=db)

    # --- Métodos de Busca (Helpers para o Service e Router) ---
    
    def get_user_by_id(self, user_id: int) -> Optional[models.Usuario]:
        """ Busca um usuário, delegando ao Repository. """
        return self.repository.get_by_id(user_id)
    
    def get_users(self) -> List[models.Usuario]:
        """ Busca um usuário, delegando ao Repository. """
        return self.repository.get_all()
    
    # --- Métodos de CRUD ---

    def create_user(self, user_data: schemas.UsuarioCreate) -> models.Usuario:
        """ LÓGICA DE NEGÓCIO: Verifica unicidade, hasheia a senha e salva. """
        
        # 1. Lógica de Negócio: Verificar se o email já existe
        if self.repository.get_by_email(user_data.email):
            raise ValueError("Email já registrado.")

        # 2. Lógica de Negócio: Hash da senha
        hashed_pass = hash_password(user_data.password)

        # 3. Prepara o dicionário para o Repository
        user_dict = user_data.model_dump(exclude_unset=True)
        user_dict["hashed_password"] = hashed_pass
        user_dict.pop("password", None) # Remove a senha não hasheada

        # 4. Persistência (Delega ao Repository)
        return self.repository.create(user_dict)
        
    
    def update_user(self, user_id: int, update_data: schemas.UsuarioUpdate) -> models.Usuario:
        """ LÓGICA DE NEGÓCIO: Busca, verifica dados e atualiza. """
        
        db_user = self.get_user_by_id(user_id) # Usa o método de busca da própria classe
        if not db_user:
            raise ValueError("Usuário não encontrado.")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Lógica de Negócio: Se a senha for enviada, hasheie-a
        if "password" in update_dict:
            update_dict["hashed_password"] = hash_password(update_dict["password"])
            update_dict.pop("password")

        # Lógica de Negócio: Se o email for alterado, verifique a unicidade
        if "email" in update_dict and update_dict["email"] != db_user.email:
            if self.repository.get_by_email(update_dict["email"]):
                raise ValueError("Novo email já está em uso.")

        # Persistência (Delega ao Repository)
        return self.repository.update(db_user, update_dict)
    