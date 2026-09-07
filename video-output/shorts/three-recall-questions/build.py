#!/usr/bin/env python3
"""Render a narrated vertical Short showing a three-question recall loop."""

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


W, H, FPS = 1080, 1920, 15
ROOT = Path(__file__).parent
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
VOICE = (
    "Here is how to turn one study topic into three recall questions. "
    "Start with the topic: how does photosynthesis work? "
    "Then ask three things: what is the goal, what are the inputs, and what comes out? "
    "Close your notes. Answer each question from memory. "
    "Now check the gaps. Those missed answers are your revision list. "
    "Do the same tomorrow with the same three questions. "
    "Follow try tera ai, and try Tera at teraai dot chat."
)
SCENES = [
    ("TURN ONE TOPIC INTO", "3 RECALL QUESTIONS", "topic"),
    ("TOPIC", "How does photosynthesis work?", "prompt"),
    ("ASK THESE 3 QUESTIONS", "Goal. Inputs. Output.", "questions"),
    ("ANSWER WITH NOTES CLOSED", "Then check only the gaps.", "answer"),
    ("YOUR MISSES ARE", "tomorrow's revision list.", "gaps"),
    ("FOLLOW @tryteraai", "Try Tera: teraai.chat", "cta"),
]


def media_duration(path: Path) -> float:
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)
    ], text=True).strip())


def lines(text, font, max_width):
    output, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if font.getlength(candidate) > max_width and current:
            output.append(current)
            current = word
        else:
            current = candidate
    return output + [current]


def text_centered(draw, text, y, font, color, max_width=W - 120, gap=84):
    wrapped = lines(text, font, max_width)
    y -= gap * (len(wrapped) - 1) // 2
    for line in wrapped:
        draw.text((W // 2, y), line, anchor="mm", font=font, fill=color)
        y += gap


def card(draw, y, index, heading, detail, accent):
    draw.rounded_rectangle((85, y, 995, y + 185), radius=34, fill=(25, 31, 58), outline=accent, width=4)
    draw.ellipse((118, y + 52, 188, y + 122), fill=accent)
    draw.text((153, y + 87), str(index), anchor="mm", font=ImageFont.truetype(BOLD, 32), fill=(9, 14, 30))
    draw.text((225, y + 58), heading, font=ImageFont.truetype(BOLD, 31), fill=(246, 248, 255))
    draw.text((225, y + 112), detail, font=ImageFont.truetype(REGULAR, 28), fill=(185, 201, 233))


def plate(scene):
    accent = [(255, 139, 91), (84, 193, 255), (151, 132, 255), (73, 221, 175), (255, 197, 85), (55, 222, 193)][scene]
    image = Image.new("RGB", (W, H), (9, 14, 30))
    draw = ImageDraw.Draw(image)
    draw.ellipse((W - 570, -260, W + 260, 570), fill=accent)
    draw.ellipse((W - 500, - 190, W + 190, 500), fill=(9, 14, 30))
    draw.rounded_rectangle((70, 75, 330, 135), radius=30, fill=accent)
    draw.text((200, 105), "TERA STUDY", anchor="mm", font=ImageFont.truetype(BOLD, 25), fill=(9, 14, 30))
    title, subtitle, kind = SCENES[scene]
    text_centered(draw, title, 400, ImageFont.truetype(BOLD, 68), (248, 250, 255), gap=82)
    text_centered(draw, subtitle, 610, ImageFont.truetype(REGULAR, 40), (188, 204, 239), gap=55)
    if kind == "topic":
        card(draw, 900, 1, "ONE TOPIC", "Any lesson, chapter, or concept", accent)
        card(draw, 1140, 2, "THREE QUESTIONS", "A small recall test", (255, 255, 255))
    elif kind == "prompt":
        draw.rounded_rectangle((85, 900, 995, 1200), radius=36, fill=(25, 31, 58), outline=accent, width=4)
        draw.text((135, 970), "STUDY TOPIC", font=ImageFont.truetype(BOLD, 29), fill=(181, 202, 241))
        text_centered(draw, "How does photosynthesis work?", 1080, ImageFont.truetype(BOLD, 46), (247, 249, 255), 760, 60)
    elif kind == "questions":
        card(draw, 830, 1, "WHAT IS THE GOAL?", "What is this process for?", accent)
        card(draw, 1055, 2, "WHAT ARE THE INPUTS?", "What does it need?", accent)
        card(draw, 1280, 3, "WHAT COMES OUT?", "What does it produce?", accent)
    elif kind == "answer":
        draw.rounded_rectangle((85, 900, 995, 1200), radius=36, fill=(25, 31, 58), outline=accent, width=4)
        draw.text((135, 970), "ANSWER FROM MEMORY", font=ImageFont.truetype(BOLD, 29), fill=(181, 202, 241))
        draw.line((135, 1065, 920, 1065), fill=(129, 151, 200), width=4)
        draw.line((135, 1135, 800, 1135), fill=(129, 151, 200), width=4)
    elif kind == "gaps":
        card(draw, 900, 1, "REMEMBERED", "Move on", accent)
        card(draw, 1140, 2, "MISSED", "Review this tomorrow", (255, 197, 85))
    else:
        draw.rounded_rectangle((75, 865, 1005, 1100), radius=40, fill=accent)
        text_centered(draw, "FOLLOW @tryteraai", 980, ImageFont.truetype(BOLD, 48), (8, 14, 30), 800, 55)
        draw.rounded_rectangle((75, 1170, 1005, 1405), radius=40, fill=(25, 31, 58), outline=accent, width=4)
        text_centered(draw, "TRY TERA", 1250, ImageFont.truetype(BOLD, 43), (248, 250, 255), 800, 55)
        text_centered(draw, "teraai.chat", 1330, ImageFont.truetype(BOLD, 43), accent, 800, 55)
    draw.text((W // 2, H - 105), "teraai.chat", anchor="mm", font=ImageFont.truetype(REGULAR, 30), fill=(183, 199, 233))
    return image


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    voice = ROOT / "voiceover.mp3"
    subprocess.run([
        "edge-tts", "--voice", "en-US-AvaMultilingualNeural", "--rate=-8%", "--text", VOICE,
        "--write-media", str(voice)
    ], check=True, timeout=120)
    total = media_duration(voice)
    scene_seconds = total / len(SCENES)
    plates = []
    for scene in range(len(SCENES)):
        output = ROOT / f"scene-{scene + 1}.png"
        plate(scene).save(output)
        plates.append(output)
    command = ["ffmpeg", "-y"]
    for image in plates:
        command.extend(["-loop", "1", "-t", str(scene_seconds), "-i", str(image)])
    inputs = "".join(f"[{index}:v]" for index in range(len(plates)))
    raw = ROOT / "three-recall-questions-raw.mp4"
    command.extend([
        "-filter_complex", f"{inputs}concat=n={len(plates)}:v=1:a=0,format=yuv420p[v]",
        "-map", "[v]", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "ultrafast", str(raw),
    ])
    subprocess.run(command, check=True, stderr=subprocess.DEVNULL)
    final = ROOT / "turn-topic-into-recall-questions-short.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(raw), "-i", str(voice), "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(final),
    ], check=True, stderr=subprocess.DEVNULL)
    print(final)


if __name__ == "__main__":
    main()
