import json
import os
import urllib.request
import urllib.error


class TeraError(Exception):
    pass


class TeraClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.environ.get("TALOCODE_API_KEY")
        self.base_url = (base_url or os.environ.get("TALOCODE_BASE_URL", "https://api.talocode.site")).rstrip("/")

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=self._headers(), method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                detail = json.loads(e.read().decode())
                msg = detail.get("error", {}).get("message", str(e))
            except Exception:
                msg = str(e)
            raise TeraError(msg)

    def health(self) -> dict:
        return self._request("GET", "/v1/tera/health")

    def capabilities(self) -> dict:
        return self._request("GET", "/v1/tera/capabilities")

    def pricing(self) -> dict:
        return self._request("GET", "/v1/tera/pricing")

    def chat_completions(self, messages: list, model: str | None = None,
                         max_tokens: int | None = None, temperature: float | None = None) -> dict:
        body = {"messages": messages}
        if model:
            body["model"] = model
        if max_tokens is not None:
            body["max_tokens"] = max_tokens
        if temperature is not None:
            body["temperature"] = temperature
        return self._request("POST", "/v1/tera/chat/completions", body)

    def writing_rewrite(self, text: str, style: str = "professional",
                        tone: str = "neutral", max_length: int | None = None) -> dict:
        body = {"text": text, "style": style, "tone": tone}
        if max_length is not None:
            body["maxLength"] = max_length
        return self._request("POST", "/v1/tera/writing/rewrite", body)

    def writing_draft(self, type: str, brief: str, audience: str = "general",
                      tone: str = "neutral", max_length: int | None = None) -> dict:
        body = {"type": type, "brief": brief, "audience": audience, "tone": tone}
        if max_length is not None:
            body["constraints"] = {"maxLength": max_length}
        return self._request("POST", "/v1/tera/writing/draft", body)

    def coding_explain(self, language: str, code: str, level: str = "intermediate",
                       focus: list | None = None) -> dict:
        body = {"language": language, "code": code, "level": level}
        if focus:
            body["focus"] = focus
        return self._request("POST", "/v1/tera/coding/explain", body)

    def coding_review(self, language: str, code: str, focus: list | None = None,
                      strictness: str = "normal") -> dict:
        body = {"language": language, "code": code, "strictness": strictness}
        if focus:
            body["focus"] = focus
        return self._request("POST", "/v1/tera/coding/review", body)

    def coding_write(self, language: str, task: str, context: str | None = None,
                     style: str = "production-ready", generate_tests: bool = False) -> dict:
        body = {"language": language, "task": task, "style": style, "generateTests": generate_tests}
        if context:
            body["context"] = context
        return self._request("POST", "/v1/tera/coding/write", body)


def create_tera_client(api_key: str | None = None, base_url: str | None = None) -> TeraClient:
    return TeraClient(api_key, base_url)
