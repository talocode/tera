#!/usr/bin/env python3
"""Upload the recall-question Short to the authorized TeraAI channel."""

import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen


CREDS_FILE = "/workspace/.youtube-tera-credentials.json"
VIDEO_FILE = os.path.join(os.path.dirname(__file__), "turn-topic-into-recall-questions-short.mp4")
TITLE = "Turn Any Topic Into 3 Active Recall Questions #Shorts"
DESCRIPTION = """Try Tera: https://teraai.chat

Subscribe for practical study methods: @tryteraai

Turn any study topic into three active recall questions: what is the goal, what are the inputs, and what comes out? Close your notes, answer from memory, and use missed answers as tomorrow's revision list.

This active recall study method is useful for exam revision, learning a new topic, and building a repeatable study routine.

https://teraai.chat

#Shorts #ActiveRecall #StudyTips #StudyMethod #Revision #Learning"""
TAGS = [
    "active recall questions", "active recall study method", "how to study", "study questions",
    "revision questions", "retrieval practice", "exam revision", "study tips", "learning techniques", "tera ai",
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
