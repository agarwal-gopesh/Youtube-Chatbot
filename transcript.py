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


def get_transcript_with_language(url):
    video_id = extract_video_id(url)
    transcript_list = YouTubeTranscriptApi().list(video_id)

    try:
        transcript = transcript_list.find_manually_created_transcript(PREFERRED_LANGS)
    except NoTranscriptFound:
        try:
            transcript = transcript_list.find_generated_transcript(PREFERRED_LANGS)
        except NoTranscriptFound:
            transcript = next(iter(transcript_list))

    text = " ".join(snippet.text for snippet in transcript.fetch())
    text = re.sub(r"\s+", " ", text).strip()
    return text, transcript.language_code


def get_transcript(url):
    text, _ = get_transcript_with_language(url)
    return text


if __name__ == "__main__":
    link = input("YouTube link: ")
    text, lang = get_transcript_with_language(link)
    print(f"Language: {lang}, Characters: {len(text)}")
    print(text[:500])