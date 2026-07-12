# Tera

AI capabilities API — chat completions, writing (rewrite/draft), coding (explain/review/write).

```bash
pip install tera
```

## Usage

```python
from tera import TeraClient

client = TeraClient(api_key="your_talocode_key")

# Chat
result = client.chat_completions([{"role": "user", "content": "Hello!"}])

# Writing
result = client.writing_rewrite("Hello world", style="professional")

# Coding
result = client.coding_explain("python", "print('hello')")
```

## CLI

```bash
tera health
tera chat --message "What is Python?"
tera rewrite --text "Hello world"
tera explain --language python --code "print('hello')"
```

Requires `TALOCODE_API_KEY` environment variable.
