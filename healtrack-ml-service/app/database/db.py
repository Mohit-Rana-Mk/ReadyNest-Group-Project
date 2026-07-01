import sqlite3
import os

DB_PATH = "logs/risk_engine.db"

os.makedirs("logs", exist_ok=True)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    return conn