from datetime import datetime, timezone
from typing import Any, Dict


def get_utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def format_response(status: str, data: Any = None, message: str = "") -> Dict[str, Any]:
    """Standard API response formatter."""
    res = {"status": status}
    if message:
        res["message"] = message
    if data is not None:
        res["data"] = data
    return res

