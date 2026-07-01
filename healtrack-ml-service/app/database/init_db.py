from app.database.db import get_connection

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risk_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        input_data TEXT,
        prediction TEXT,
        risk_percentage REAL,
        risk_level TEXT
    )
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()