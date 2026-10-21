from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from transcript import extract_video_id, get_transcript_with_language

CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "youtube_videos"

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
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "।", ".", "?", "!", " ", ""],
)


def is_indexed(video_id):
    result = vector_store.get(where={"video_id": video_id}, limit=1)
    return len(result["ids"]) > 0


def index_video(url):
    video_id = extract_video_id(url)
    if is_indexed(video_id):
        return video_id

    text, language = get_transcript_with_language(url)
    chunks = splitter.split_text(text)

    metadatas = [
        {
            "video_id": video_id,
            "language": language,
            "chunk_index": i,
            "url": url,
        }
        for i in range(len(chunks))
    ]
    ids = [f"{video_id}_{i}" for i in range(len(chunks))]

    vector_store.add_texts(texts=chunks, metadatas=metadatas, ids=ids)
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
            question, k=6, filter={"video_id": video_id}
        )
        for doc, score in results:
            print(f"\n[score {score:.3f}] chunk {doc.metadata['chunk_index']}")
            print(doc.page_content)