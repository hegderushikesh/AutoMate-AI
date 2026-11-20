import os
from typing import Optional
from supabase import create_client, Client, ClientOptions
from app.core.config import get_settings

settings = get_settings()

_supabase_client: Optional[Client] = None
_supabase_offline: bool = False


def get_supabase_client() -> Optional[Client]:
    """
    Returns a configured Supabase client using service role key (backend only)
    or public anon key. Returns None if credentials are not configured or in test mode.
    """
    if os.environ.get("TESTING") == "1" or settings.APP_ENV == "test":
        return None

    global _supabase_client, _supabase_offline
    if _supabase_offline:
        return None
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if not url or not key:
        return None

    try:
        options = ClientOptions(
            postgrest_client_timeout=3.0,
            storage_client_timeout=3,
        )
        _supabase_client = create_client(url, key, options=options)
        return _supabase_client
    except Exception as e:
        print(f"[Supabase] Warning: Unable to initialize client: {e}")
        _supabase_offline = True
        return None


def mark_supabase_offline():
    """Flags Supabase as unreachable so calls failover to local storage immediately without timeout penalty."""
    global _supabase_offline, _supabase_client
    _supabase_offline = True
    _supabase_client = None


def is_supabase_configured() -> bool:
    """Checks whether valid Supabase configuration is present."""
    return bool(settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY))
