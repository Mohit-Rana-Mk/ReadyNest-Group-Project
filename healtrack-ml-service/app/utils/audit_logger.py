import json
from datetime import datetime
import os

LOG_FILE = "logs/audit_logs.json"


def log_prediction(input_data, output_data):
    os.makedirs("logs", exist_ok=True)

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "input": input_data,
        "output": output_data
    }

    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")