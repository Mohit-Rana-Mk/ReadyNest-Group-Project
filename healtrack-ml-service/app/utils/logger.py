# app/utils/logger.py
import logging
import os

# Create log directory if it does not exist
os.makedirs("logs", exist_ok=True)

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("enterprise_ai")
