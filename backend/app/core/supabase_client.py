from typing import Optional
from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns a configured Supabase client using service role key (backend only)
    or public anon key. Returns None if credentials are not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if not url or not key:
        return None

    try:
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        print(f"[Supabase] Warning: Unable to initialize client: {e}")
        return None


def is_supabase_configured() -> bool:
    """Checks whether valid Supabase configuration is present."""
    return bool(settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY))
