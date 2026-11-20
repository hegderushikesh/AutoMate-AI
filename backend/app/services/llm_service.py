import os
import logging
from typing import Optional, Tuple

from groq import (
    AsyncGroq,
    AuthenticationError,
    RateLimitError,
    APITimeoutError,
    APIConnectionError,
    BadRequestError,
    NotFoundError,
)
from app.core.config import get_settings

logger = logging.getLogger("automate.llm")
settings = get_settings()


class LLMAuthenticationError(Exception):
    """Raised when the Groq API key is missing or invalid."""
    pass


class LLMRateLimitError(Exception):
    """Raised when the Groq API rate limit is exceeded."""
    pass


class LLMTimeoutError(Exception):
    """Raised when the Groq API request exceeds the timeout threshold."""
    pass


class LLMConnectionError(Exception):
    """Raised when unable to connect to the Groq API service."""
    pass


class LLMModelUnavailableError(Exception):
    """Raised when the configured Groq model is deprecated or not available."""
    pass


class LLMServiceError(Exception):
    """Generic error when the Groq LLM returns an unhandled error response."""
    pass


class LLMService:
    """
    Cloud-native LLM Generation Service powered by Groq Cloud API.
    Uses official Groq Python SDK with high-throughput LPU inference.
    Preserves strict automotive grounding rules, citations, and error recovery.
    """

    SYSTEM_PROMPT = """You are AutoMate AI, an authoritative, precision-focused Automotive AI Assistant.
Your mission is to provide accurate, factual, and deeply technical answers regarding vehicle specifications, features, performance, charging, and engineering.

STRICT GROUNDING RULES:
1. You must answer ONLY using the verified context provided below (Structured Vehicle Specifications and Retrieved OEM Brochure Passages).
2. For EVERY technical claim, specification, or fact you mention, you MUST append a citation referencing the source document and page number in this format: [Doc: <Filename>, Page: <PageNumber>].
3. If the answer cannot be determined with complete confidence from the provided context, state clearly and concisely: "Not found in the brochure."
4. NEVER invent, extrapolate, or hallucinate vehicle specifications, trim levels, battery sizes, acceleration times, or features.
5. Present numerical specifications with proper units (hp, Nm, kWh, kW, mm, MPGe, seconds) and format currency in Indian Rupees (₹ / INR, Lakhs and Crores).
6. Format your responses with clean markdown, bullet points, or comparison tables when appropriate."""

    FALLBACK_ANSWER = (
        "I analyzed the vehicle brochure context, but was unable to produce a definitive summary. "
        "Please rephrase or specify the exact vehicle trim or parameter you are inquiring about."
    )

    @classmethod
    def get_client(cls) -> AsyncGroq:
        """Instantiates or retrieves the AsyncGroq client using GROQ_API_KEY."""
        api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            raise LLMAuthenticationError(
                "GROQ_API_KEY is not configured. Please set GROQ_API_KEY in your environment variables to enable AI generation."
            )
        return AsyncGroq(api_key=api_key, timeout=settings.GROQ_TIMEOUT)

    @classmethod
    async def generate_chat_completion(
        cls,
        context_prompt: str,
        user_query: str,
        system_prompt: Optional[str] = None,
        max_retries: int = 1,
    ) -> Tuple[str, str]:
        """
        Executes cloud inference via Groq Cloud API.
        Returns:
            Tuple[cleaned_answer, raw_response_preview]
        Raises:
            LLMAuthenticationError, LLMRateLimitError, LLMTimeoutError,
            LLMConnectionError, LLMModelUnavailableError, LLMServiceError
        """
        sys_prompt = system_prompt or cls.SYSTEM_PROMPT
        model_name = settings.GROQ_MODEL or "llama-3.3-70b-versatile"

        client = cls.get_client()

        messages = [
            {"role": "system", "content": sys_prompt},
            {
                "role": "user",
                "content": f"{context_prompt}\n\nUSER QUESTION:\n{user_query}\n\nProvide a factual, grounded answer with citations [Doc: <Filename>, Page: <PageNumber>]:",
            },
        ]

        attempt = 0
        raw_response_text = ""

        while attempt <= max_retries:
            attempt += 1
            try:
                logger.info(
                    f"[LLMService] Dispatching inference to Groq Cloud | model={model_name} | attempt={attempt}"
                )
                chat_completion = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024,
                )

                choices = chat_completion.choices
                if not choices:
                    if attempt <= max_retries:
                        logger.warning(f"[LLMService] Empty choices received from Groq on attempt {attempt}. Retrying...")
                        continue
                    raise LLMServiceError("Groq API returned an empty choices list.")

                raw_text = choices[0].message.content or ""
                raw_response_text = str(raw_text).strip()

                if raw_response_text:
                    return raw_response_text, raw_response_text[:500]

                # If text is empty on first attempt, retry once
                if attempt <= max_retries:
                    logger.warning(f"[LLMService] Groq returned blank response on attempt {attempt}. Retrying...")
                    continue

            except AuthenticationError as e:
                logger.error(f"[LLMService] Groq authentication failure: {e}")
                raise LLMAuthenticationError(
                    f"Groq API authentication failed: Invalid or missing API key. Please check your GROQ_API_KEY environment variable."
                ) from e
            except RateLimitError as e:
                logger.error(f"[LLMService] Groq rate limit exceeded: {e}")
                raise LLMRateLimitError(
                    f"Groq Cloud rate limit exceeded. Please wait a few moments before submitting another request."
                ) from e
            except APITimeoutError as e:
                logger.error(f"[LLMService] Groq request timed out: {e}")
                raise LLMTimeoutError(
                    f"Groq Cloud inference request timed out after {settings.GROQ_TIMEOUT}s."
                ) from e
            except APIConnectionError as e:
                logger.error(f"[LLMService] Groq connection error: {e}")
                raise LLMConnectionError(
                    f"Failed to connect to Groq Cloud API service. Please verify network connectivity."
                ) from e
            except (NotFoundError, BadRequestError) as e:
                logger.error(f"[LLMService] Groq model error: {e}")
                raise LLMModelUnavailableError(
                    f"Configured Groq model '{model_name}' is unavailable or invalid: {str(e)}"
                ) from e
            except (
                LLMAuthenticationError,
                LLMRateLimitError,
                LLMTimeoutError,
                LLMConnectionError,
                LLMModelUnavailableError,
            ):
                raise
            except Exception as e:
                logger.error(f"[LLMService] Unexpected Groq API error: {e}", exc_info=True)
                if attempt > max_retries:
                    raise LLMServiceError(f"Groq API communication error: {str(e)}") from e

        # Safe fallback if empty text after retry
        logger.warning("[LLMService] Returning fallback answer after empty Groq response.")
        return cls.FALLBACK_ANSWER, raw_response_text[:500]
