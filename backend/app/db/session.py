from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

'''creates SQLAlchemy's connection interface to MySQL'''
engine = create_engine(
    settings.database_url,
    pool_pre_ping =  True,
    pool_recycle = 3600, #sqlalchemy recycles pooled connections after 3600s
)


'''creates database sessions'''
SessionLocal = sessionmaker(
    bind = engine,
    autoflush = False,
    autocommit = False,
)

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()