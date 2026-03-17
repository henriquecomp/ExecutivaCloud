from pydantic import BaseModel, Field, AliasChoices

class LoginBase(BaseModel):
    id: int = Field(validation_alias=AliasChoices("id", "userId"))
    


class Login(LoginBase):
    pass

    # Configuração crucial para ler dados de objetos ORM (SQLAlchemy)
    class Config:
        from_attributes = True