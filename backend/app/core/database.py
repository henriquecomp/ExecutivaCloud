from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from typing import Generator

# URL de Conexão: Usaremos SQLite para simplificar no desenvolvimento
# Se fosse PostgreSQL: "postgresql://user:password@host:port/dbname"
DATABASE_URL = "sqlite:///./sql_app.db"

# A engine é o ponto de comunicação com o banco de dados
# check_same_thread é apenas para SQLite, pois ele não lida com múltiplos threads
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# A sessão é a "área de trabalho" de um único acesso ao DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# A classe base para a criação dos modelos (tabelas)
class Base(DeclarativeBase):
    pass

# Função de Injeção de Dependência (Dependency Injection)
# O FastAPI usará isso para criar uma sessão de DB para cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        # Garante que a sessão é fechada após a requisição,
        # liberando o recurso do DB.
        db.close()