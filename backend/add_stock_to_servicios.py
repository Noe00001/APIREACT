import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE servicios ADD COLUMN stock INT NOT NULL DEFAULT 12;"))
        conn.commit()
        print("Column 'stock' added successfully to 'servicios' table.")
    except Exception as e:
        print(f"Error: {e}")
