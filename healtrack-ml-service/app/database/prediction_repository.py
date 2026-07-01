import json
from datetime import datetime

from app.database.db import get_connection


def save_prediction(input_data: dict, result: dict) -> bool:
    """
    Save prediction history into SQLite database.

    Returns:
        True  -> Saved successfully
        False -> Failed to save
    """

    conn = None

    try:

        conn = get_connection()
        cursor = conn.cursor()

        risks = result.get("risks", {})
        recommendations = result.get("recommendations", {})

        cursor.execute(
            """
            INSERT INTO risk_predictions (
                timestamp,
                input_data,
                prediction,
                risk_percentage,
                risk_level
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                datetime.utcnow().isoformat(),

                json.dumps(input_data),

                json.dumps(risks),

                round(max(risks.values()), 2) if risks else 0.0,

                recommendations.get("visit_priority", "Routine"),
            ),
        )

        conn.commit()

        return True

    except Exception as error:

        print(f"[DATABASE ERROR] {error}")

        return False

    finally:

        if conn:
            conn.close()