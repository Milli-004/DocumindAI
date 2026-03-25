# Kept for backward compatibility.
# All new code should use core.security directly — it reads
# SECRET_KEY and ALGORITHM from config/environment, not a hardcoded string.
from core.security import create_access_token, decode_access_token  # re-export

__all__ = ["create_access_token", "decode_access_token"]
