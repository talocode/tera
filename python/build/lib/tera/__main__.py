import argparse
import json
import sys
from .client import TeraClient, TeraError


def main():
    parser = argparse.ArgumentParser(prog="tera", description="AI capabilities API")
    parser.add_argument("--version", action="version", version="0.1.0")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("health", help="Check API health")
    sub.add_parser("capabilities", help="List capabilities")

    chat_p = sub.add_parser("chat", help="Chat completion")
    chat_p.add_argument("--message", "-m", required=True, help="User message")

    rewrite_p = sub.add_parser("rewrite", help="Rewrite text")
    rewrite_p.add_argument("--text", "-t", required=True, help="Text to rewrite")

    draft_p = sub.add_parser("draft", help="Draft content")
    draft_p.add_argument("--type", required=True, help="Content type (email, social_post, article, etc.)")
    draft_p.add_argument("--brief", required=True, help="Content brief")

    explain_p = sub.add_parser("explain", help="Explain code")
    explain_p.add_argument("--language", required=True, help="Programming language")
    explain_p.add_argument("--code", required=True, help="Code to explain")

    review_p = sub.add_parser("review", help="Review code")
    review_p.add_argument("--language", required=True, help="Programming language")
    review_p.add_argument("--code", required=True, help="Code to review")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    client = TeraClient()

    try:
        if args.command == "health":
            result = client.health()
        elif args.command == "capabilities":
            result = client.capabilities()
        elif args.command == "chat":
            result = client.chat_completions([{"role": "user", "content": args.message}])
        elif args.command == "rewrite":
            result = client.writing_rewrite(args.text)
        elif args.command == "draft":
            result = client.writing_draft(args.type, args.brief)
        elif args.command == "explain":
            result = client.coding_explain(args.language, args.code)
        elif args.command == "review":
            result = client.coding_review(args.language, args.code)
        else:
            print(f"Unknown command: {args.command}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(result, indent=2))
    except TeraError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
