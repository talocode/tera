#!/usr/bin/env python3
"""Upload the active-recall learning Short to the authorized TeraAI channel."""

import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen


CREDS_FILE = "/workspace/.youtube-tera-credentials.json"
VIDEO_FILE = os.path.join(os.path.dirname(__file__), "active-recall-study-method-short.mp4")
TITLE = "Active Recall Study Method: Stop Rereading Notes #Shorts"
DESCRIPTION = """Learn an active recall study method that turns one set of notes into a focused revision loop.

Close your notes. Write three questions. Answer from memory. Check the gaps. Review only what you missed.

This Short is for students preparing for exams, learners building durable understanding, and anyone who wants a practical alternative to rereading notes.

Follow @tryteraai for practical study methods, recall exercises, and revision workflows.

#Shorts #ActiveRecall #StudyTips #StudyMethod #Revision #Learning"""
TAGS = [
    "active recall", "active recall study method", "study method", "study tips", "stop rereading notes",
    "revision technique", "retrieval practice", "exam revision", "how to study", "learning techniques", "tera ai",
]


def refresh_token(credentials):
    request = Request("https://oauth2.googleapis.com/token", data=urlencode({
        "client_id": credentials["client_id"], "client_secret": credentials["client_secret"],
        "refresh_token": credentials["refresh_token"], "grant_type": "refresh_token",
    }).encode(), method="POST")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")
    return json.loads(urlopen(request).read().decode())["access_token"]


def upload(token):
    metadata = {
        "snippet": {"title": TITLE, "description": DESCRIPTION, "tags": TAGS, "categoryId": "27"},
        "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
    }
    size = os.path.getsize(VIDEO_FILE)
    request = Request(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        data=json.dumps(metadata).encode(), method="POST",
    )
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Content-Type", "application/json")
    request.add_header("X-Upload-Content-Type", "video/mp4")
    request.add_header("X-Upload-Content-Length", str(size))
    session_url = urlopen(request).headers["Location"]
    with open(VIDEO_FILE, "rb") as video:
        payload = video.read()
    request = Request(session_url, data=payload, method="PUT")
    request.add_header("Content-Type", "video/mp4")
    request.add_header("Content-Length", str(size))
    return json.loads(urlopen(request).read().decode())["id"]


if __name__ == "__main__":
    with open(CREDS_FILE) as credentials_file:
        video_id = upload(refresh_token(json.load(credentials_file)))
    print(f"https://www.youtube.com/shorts/{video_id}")
