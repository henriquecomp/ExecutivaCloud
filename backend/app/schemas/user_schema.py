# app/schemas/usuario_schema.py

from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional

# Base: Campos comuns
class UsuarioBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None

# Input: Criação de Usuário (precisa da senha não hasheada)
class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)

# Input/Output: Atualização de Usuário (todos os campos opcionais)
class UsuarioUpdate(UsuarioBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None # Se for atualizar a senha
    
    # Adicionamos um validador para garantir que pelo menos um campo seja enviado na atualização
    @model_validator(mode='before')
    def check_at_least_one_field(cls, values):
        if not any(values.values()):
            raise ValueError("Pelo menos um campo deve ser fornecido para a atualização.")
        return values

# Output: Resposta da API (não inclui a senha hasheada)
class Usuario(UsuarioBase):
    id: int # O id é gerado pelo banco
    is_active: bool

    # Configuração crucial para ler dados de objetos ORM (SQLAlchemy)
    class Config:
        from_attributes = True