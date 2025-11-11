from pydantic import BaseModel, EmailStr, Field, model_validator, AliasChoices
from typing import Optional

class LoginBase(BaseModel):
    id: int = Field(alias='fullName', validation_alias=AliasChoices('name') )
    


class Login(LoginBase):
    pass

    # Configuração crucial para ler dados de objetos ORM (SQLAlchemy)
    class Config:
        from_attributes = True