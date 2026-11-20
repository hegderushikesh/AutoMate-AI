import logging
import re
from typing import Optional, Tuple
import httpx

from app.core.config import get_settings

logger = logging.getLogger("automate.llm")
settings = get_settings()


class LLMTimeoutError(Exception):
    """Raised when the LLM service exceeds the timeout threshold."""
    pass


class LLMConnectionError(Exception):
    """Raised when unable to connect to the LLM service."""
    pass


class LLMServiceError(Exception):
    """Raised when the LLM service returns an invalid or error response."""
    pass


class LLMService:
    """
    Communicates with Ollama through the OpenAI-compatible v1 endpoint.
    Handles timeout, connection failures, Qwen3 <think> tags, and guarantees non-empty responses.
    """

    SYSTEM_PROMPT = (
        "You are AutoMate AI, an authoritative, precision-focused Automotive AI Assistant.\n"
        "Your mission is to provide accurate, factual, and deeply technical answers regarding vehicle specifications, "
        "features, performance, charging, and engineering grounded strictly in OEM brochures.\n"
        "STRICT RULES:\n"
        "1. Never invent or hallucinate specifications.\n"
        "2. Keep answers concise, factual, and formatted with clean markdown.\n"
        "3. Include citations like [Doc: <Filename>, Page: <PageNumber>] whenever referencing brochure text.\n"
        "4. Answer directly. DO NOT output chain-of-thought or <think> tags in your final answer."
    )

    FALLBACK_ANSWER = (
        "I analyzed the vehicle brochure context, but was unable to generate a conclusive technical summary. "
        "Please rephrase or specify the exact vehicle trim or parameter you are inquiring about."
    )

    @staticmethod
    def clean_qwen_output(text: Optional[str]) -> str:
        """
        Cleans Qwen3 reasoning output:
        - Removes closed <think>...</think> tags.
        - Removes unclosed <think> tags.
        - Strips whitespace.
        """
        if not text:
            return ""
        # Remove complete <think>...</think> blocks
        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
        # Handle unclosed <think> tag
        if "<think>" in cleaned:
            cleaned = re.sub(r"<think>.*", "", cleaned, flags=re.DOTALL).strip()
        return cleaned

    @classmethod
    async def generate_chat_completion(
        cls,
        context_prompt: str,
        user_query: str,
        system_prompt: Optional[str] = None,
        max_retries: int = 1,
    ) -> Tuple[str, str]:
        """
        Calls Ollama at LLM_BASE_URL/chat/completions with stream=False, temperature=0.1,
        and a 120s timeout.
        Returns:
            Tuple[cleaned_answer, raw_response_preview]
        Raises:
            LLMTimeoutError, LLMConnectionError, LLMServiceError
        """
        endpoint = f"{settings.LLM_BASE_URL}/chat/completions"
        sys_prompt = system_prompt or cls.SYSTEM_PROMPT

        # Add /no_think to user message to instruct Qwen3 to suppress think tokens
        user_content = f"{context_prompt}\n\nUSER QUESTION: {user_query}\n/no_think"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.1,
            "stream": False,
        }

        raw_response_text = ""
        attempt = 0

        while attempt <= max_retries:
            attempt += 1
            try:
                timeout = httpx.Timeout(120.0, connect=10.0)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(endpoint, json=payload)

                    if resp.status_code != 200:
                        raise LLMServiceError(
                            f"Ollama returned HTTP {resp.status_code}: {resp.text[:300]}"
                        )

                    data = resp.json()
                    choices = data.get("choices", [])
                    if not choices:
                        if attempt <= max_retries:
                            logger.warning(f"[LLMService] Empty choices on attempt {attempt}. Retrying...")
                            continue
                        raise LLMServiceError("Ollama response contained no choices.")

                    choice_msg = choices[0].get("message", {})
                    content = choice_msg.get("content")
                    reasoning = choice_msg.get("reasoning")

                    # In Ollama's OpenAI API, content or reasoning holds text
                    raw_text = content if (content is not None and str(content).strip()) else (reasoning or "")
                    raw_response_text = str(raw_text)

                    cleaned = cls.clean_qwen_output(raw_response_text)

                    # If content was empty or only think tags, but reasoning had content
                    if not cleaned and reasoning:
                        cleaned = cls.clean_qwen_output(str(reasoning))

                    if cleaned and cleaned.strip():
                        return cleaned.strip(), raw_response_text[:500]

                    # Cleaned answer was empty; retry once with a concise direct instruction
                    if attempt <= max_retries:
                        logger.warning(
                            f"[LLMService] Attempt {attempt} returned empty cleaned text. Retrying once..."
                        )
                        payload["messages"] = [
                            {"role": "system", "content": "Answer the question directly in 2-3 sentences based strictly on the context. Do not think."},
                            {"role": "user", "content": f"{context_prompt[:1200]}\n\nQuestion: {user_query}\n/no_think"},
                        ]
                        continue

            except httpx.TimeoutException as e:
                logger.error(f"[LLMService] Request timed out after 120s to {endpoint}: {e}")
                raise LLMTimeoutError(
                    f"LLM request timed out after 120 seconds. Please check local Ollama capacity."
                ) from e
            except httpx.ConnectError as e:
                logger.error(f"[LLMService] Connection failed to {endpoint}: {e}")
                raise LLMConnectionError(
                    f"Cannot connect to Ollama at {settings.LLM_BASE_URL}. Ensure Ollama is running."
                ) from e
            except (LLMTimeoutError, LLMConnectionError):
                raise
            except Exception as e:
                logger.error(f"[LLMService] Unexpected error communicating with {endpoint}: {e}")
                if attempt > max_retries:
                    raise LLMServiceError(f"LLM communication error: {str(e)}") from e

        # If after retries cleaned text is still empty, return safe non-empty fallback message
        logger.warning("[LLMService] Cleaned response remained empty after retries. Using fallback answer.")
        return cls.FALLBACK_ANSWER, raw_response_text[:500]
