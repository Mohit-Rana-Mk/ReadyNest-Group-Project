import sqlite3

conn = sqlite3.connect("logs/risk_engine.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM risk_predictions")
rows = cursor.fetchall()

for row in rows:
    print(row)

conn.close()