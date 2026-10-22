import re

from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound

PREFERRED_LANGS = ["en", "hi"]


def extract_video_id(url):
    pattern = r"(?:v=|youtu\.be/|shorts/|embed/|live/)([A-Za-z0-9_-]{11})"
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url.strip()):
        return url.strip()
    raise ValueError(f"Could not find a video ID in: {url}")


def get_timed_transcript(url):
    video_id = extract_video_id(url)
    transcript_list = YouTubeTranscriptApi().list(video_id)

    try:
        transcript = transcript_list.find_manually_created_transcript(PREFERRED_LANGS)
    except NoTranscriptFound:
        try:
            transcript = transcript_list.find_generated_transcript(PREFERRED_LANGS)
        except NoTranscriptFound:
            transcript = next(iter(transcript_list))

    pieces = []
    time_marks = []
    position = 0

    for snippet in transcript.fetch():
        piece = re.sub(r"\s+", " ", snippet.text).strip()
        if not piece:
            continue
        time_marks.append((position, snippet.start))
        pieces.append(piece)
        position += len(piece) + 1

    text = " ".join(pieces)
    return text, transcript.language_code, time_marks


def get_transcript_with_language(url):
    text, language, _ = get_timed_transcript(url)
    return text, language


def get_transcript(url):
    text, _, _ = get_timed_transcript(url)
    return text


if __name__ == "__main__":
    link = input("YouTube link: ")
    text, lang, marks = get_timed_transcript(link)
    print(f"Language: {lang}, Characters: {len(text)}, Timestamps: {len(marks)}")
    print(text[:500])