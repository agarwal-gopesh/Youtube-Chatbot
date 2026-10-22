from bisect import bisect_right

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from transcript import extract_video_id, get_timed_transcript

CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "youtube_videos"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={"device": "mps"},
    encode_kwargs={"normalize_embeddings": True, "batch_size": 16},
)

vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
    persist_directory=CHROMA_DIR,
)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", "।", ".", "?", "!", " ", ""],
    add_start_index=True,
)


def is_indexed(video_id):
    result = vector_store.get(where={"video_id": video_id}, limit=1)
    if not result["ids"]:
        return False
    if "start_time" in result["metadatas"][0]:
        return True
    vector_store.delete(where={"video_id": video_id})
    return False


def time_at(time_marks, char_index):
    offsets = [offset for offset, _ in time_marks]
    position = max(bisect_right(offsets, char_index) - 1, 0)
    return int(time_marks[position][1])


def index_video(url):
    video_id = extract_video_id(url)
    if is_indexed(video_id):
        return video_id

    text, language, time_marks = get_timed_transcript(url)
    docs = splitter.create_documents([text])

    texts = [doc.page_content for doc in docs]
    metadatas = [
        {
            "video_id": video_id,
            "language": language,
            "chunk_index": i,
            "start_time": time_at(time_marks, doc.metadata["start_index"]),
            "url": url,
        }
        for i, doc in enumerate(docs)
    ]
    ids = [f"{video_id}_{i}" for i in range(len(docs))]

    vector_store.add_texts(texts=texts, metadatas=metadatas, ids=ids)
    return video_id


def get_retriever(video_id, k=4):
    return vector_store.as_retriever(
        search_kwargs={"k": k, "filter": {"video_id": video_id}}
    )


if __name__ == "__main__":
    link = input("YouTube link: ")
    video_id = index_video(link)
    print("Indexed video:", video_id)

    while True:
        question = input("\nQuestion (empty to quit): ")
        if not question:
            break
        results = vector_store.similarity_search_with_score(
            question, k=4, filter={"video_id": video_id}
        )
        for doc, score in results:
            print(
                f"\n[score {score:.3f}] chunk {doc.metadata['chunk_index']} "
                f"at {doc.metadata['start_time']}s"
            )
            print(doc.page_content)