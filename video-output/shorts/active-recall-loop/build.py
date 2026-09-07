#!/usr/bin/env python3
"""Render a narrated, captioned vertical Short about active recall."""

import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


W, H, FPS = 1080, 1920, 15
ROOT = Path(__file__).parent
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
VOICE = (
    "Your notes can feel familiar and still disappear when you need them. "
    "Rereading is comfortable because the answer is right in front of you. "
    "Try this instead. Close the notes, then write three questions about what you just studied. "
    "Answer each one from memory before you look back. Now check your answers. "
    "The gaps are not failure. They are your revision plan. "
    "Review only what you missed today, tomorrow, and next week. "
    "You do not need more rereading. You need more retrieval. "
    "Save this: close, question, answer, check, repeat. "
    "Follow at try tera ai for practical study methods."
)
SCENES = [
    ("YOUR NOTES CAN FEEL FAMILIAR", "and still disappear when you need them.", "familiar"),
    ("REREADING FEELS EASY", "The answer is already in front of you.", "reread"),
    ("1. CLOSE THE NOTES", "Write 3 questions from memory.", "questions"),
    ("2. ANSWER BEFORE YOU CHECK", "Make retrieval do the work.", "answer"),
    ("3. CHECK THE GAPS", "What you missed becomes the revision plan.", "check"),
    ("CLOSE. QUESTION. ANSWER.", "CHECK. REPEAT.  @tryteraai", "repeat"),
]
CAPTIONS = [
    (0, 5, "Your notes can feel familiar and still disappear when you need them."),
    (5, 10, "Rereading is comfortable because the answer is right in front of you."),
    (10, 16, "Close the notes, then write three questions about what you just studied."),
    (16, 22, "Answer each one from memory before you look back."),
    (22, 29, "Check your answers. The gaps are your revision plan."),
    (29, 36, "Review only what you missed today, tomorrow, and next week."),
    (36, 43, "You do not need more rereading. You need more retrieval."),
    (43, 50, "Close. Question. Answer. Check. Repeat. Follow @tryteraai."),
]


def duration(path: Path) -> float:
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)
    ], text=True).strip())


def fit_lines(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if font.getlength(candidate) > max_width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines + [line]


def centered(draw: ImageDraw.ImageDraw, text: str, y: int, font, color, width=W - 120, gap=86):
    lines = fit_lines(text, font, width)
    y -= gap * (len(lines) - 1) // 2
    for line in lines:
        draw.text((W // 2, y), line, anchor="mm", font=font, fill=color)
        y += gap


def draw_card(draw, box, color, title, detail=""):
    draw.rounded_rectangle(box, radius=36, fill=(24, 30, 57), outline=color, width=4)
    x1, y1, x2, y2 = box
    draw.text((x1 + 38, y1 + 52), title, font=ImageFont.truetype(FONT_BOLD, 35), fill=(245, 247, 255))
    if detail:
        draw.text((x1 + 38, y1 + 108), detail, font=ImageFont.truetype(FONT, 28), fill=(178, 191, 224))


def image_for(scene: int, scene_frame: int, scene_total: int):
    t = min(1, scene_frame / max(scene_total * 0.18, 1))
    bg = Image.new("RGB", (W, H), (10, 14, 31))
    draw = ImageDraw.Draw(bg)
    accent = [(255, 119, 112), (255, 183, 77), (64, 196, 255), (94, 223, 158), (180, 130, 255), (55, 222, 193)][scene]
    draw.ellipse((W - 680, -290, W + 240, 630), fill=accent)
    draw.ellipse((W - 610, -220, W + 170, 560), fill=(10, 14, 31))
    draw.rounded_rectangle((70, 75, 310, 135), radius=30, fill=accent)
    draw.text((190, 105), "TERA STUDY", anchor="mm", font=ImageFont.truetype(FONT_BOLD, 25), fill=(10, 14, 31))
    title, sub, kind = SCENES[scene]
    title_font = ImageFont.truetype(FONT_BOLD, 70)
    sub_font = ImageFont.truetype(FONT, 38)
    offset = int((1 - t) * 55)
    centered(draw, title, 435 + offset, title_font, (250, 252, 255), gap=88)
    centered(draw, sub, 670 + offset, sub_font, (185, 201, 235), gap=52)

    if kind == "familiar":
        draw_card(draw, (95, 885, 985, 1105), accent, "I recognize this page", "Recognition is not recall")
        draw_card(draw, (95, 1155, 985, 1375), (255, 255, 255), "Can I explain it without notes?", "That is the useful test")
    elif kind == "reread":
        draw_card(draw, (95, 895, 985, 1125), accent, "READ", "The answer stays visible")
        draw_card(draw, (95, 1170, 985, 1400), (255, 119, 112), "RETRIEVE", "The answer must come from you")
    elif kind == "questions":
        for i, text in enumerate(("What caused it?", "How does it work?", "What is one example?")):
            draw_card(draw, (95, 875 + i * 190, 985, 1035 + i * 190), accent, f"Q{i + 1}", text)
    elif kind == "answer":
        draw_card(draw, (95, 890, 985, 1130), accent, "QUESTION", "Why does this happen?")
        draw.rounded_rectangle((95, 1185, 985, 1425), radius=36, fill=(24, 30, 57), outline=(245, 247, 255), width=4)
        draw.text((140, 1260), "MY ANSWER", font=ImageFont.truetype(FONT_BOLD, 30), fill=(184, 203, 238))
        draw.line((140, 1340, 920, 1340), fill=(126, 147, 196), width=4)
    elif kind == "check":
        draw_card(draw, (95, 890, 985, 1115), accent, "GOT IT", "Keep moving")
        draw_card(draw, (95, 1170, 985, 1395), (255, 183, 77), "MISSED IT", "Review this next")
    else:
        steps = ("CLOSE", "QUESTION", "ANSWER", "CHECK", "REPEAT")
        for i, step in enumerate(steps):
            x = 95 + (i % 2) * 455
            y = 885 + (i // 2) * 190
            draw.rounded_rectangle((x, y, x + 390, y + 135), radius=34, fill=(24, 30, 57), outline=accent, width=3)
            draw.text((x + 195, y + 68), step, anchor="mm", font=ImageFont.truetype(FONT_BOLD, 31), fill=(245, 247, 255))

    active_caption = next((caption for start, end, caption in CAPTIONS if start <= (scene_frame / FPS) + scene * 8 < end), CAPTIONS[-1][2])
    draw.rounded_rectangle((55, 1645, 1025, 1815), radius=32, fill=(5, 8, 19), outline=(87, 104, 148), width=2)
    centered(draw, active_caption, 1730, ImageFont.truetype(FONT_BOLD, 30), (255, 255, 255), width=880, gap=40)
    return bg


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    voice = ROOT / "voiceover.mp3"
    if not voice.exists():
        subprocess.run([
            "edge-tts", "--voice", "en-US-AvaMultilingualNeural", "--rate=-8%", "--text", VOICE,
            "--write-media", str(voice)
        ], check=True, timeout=120)
    video_length = duration(voice)
    per_scene = video_length / len(SCENES)
    plates = []
    for scene in range(len(SCENES)):
        plate = ROOT / f"scene-{scene + 1}.png"
        image_for(scene, int(per_scene * FPS * 0.4), int(per_scene * FPS)).save(plate)
        plates.append(plate)
    raw = ROOT / "active-recall-raw.mp4"
    command = ["ffmpeg", "-y"]
    for plate in plates:
        command.extend(["-loop", "1", "-t", str(per_scene), "-i", str(plate)])
    concat_inputs = "".join(f"[{index}:v]" for index in range(len(plates)))
    command.extend([
        "-filter_complex", f"{concat_inputs}concat=n={len(plates)}:v=1:a=0,format=yuv420p[v]",
        "-map", "[v]", "-r", str(FPS), "-c:v", "libx264", "-crf", "18", "-preset", "ultrafast", str(raw)
    ])
    subprocess.run(command, check=True, stderr=subprocess.DEVNULL)
    final = ROOT / "active-recall-study-method-short.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(raw), "-i", str(voice), "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(final)
    ], check=True, stderr=subprocess.DEVNULL)
    print(final)


if __name__ == "__main__":
    main()
