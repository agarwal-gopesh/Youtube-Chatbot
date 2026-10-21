import uuid
from typing import Annotated, TypedDict

import requests
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from vector_store import index_video, get_retriever, vector_store

load_dotenv()

MODEL_NAME = "gemini-3.6-flash"
TOP_K = 6
INTRO_CHUNKS = 3

llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3)
chats = {}


class ChatState(TypedDict):
    messages: Annotated[list, add_messages]
    video_id: str
    query: str
    context: str


def to_text(content):
    if isinstance(content, str):
        return content
    return "".join(
        part if isinstance(part, str) else part.get("text", "") for part in content
    )


def rewrite_query(state: ChatState):
    messages = state["messages"]
    question = to_text(messages[-1].content)

    if len(messages) == 1:
        return {"query": question}

    history = "\n".join(f"{m.type}: {to_text(m.content)}" for m in messages[:-1])
    prompt = (
        f"Chat history:\n{history}\n\n"
        f"Rewrite the last question as a standalone question that makes sense "
        f"without the chat history. Return only the question.\n\n"
        f"Last question: {question}"
    )
    return {"query": to_text(llm.invoke(prompt).content).strip()}


def retrieve(state: ChatState):
    video_id = state["video_id"]
    chunks = {}

    for doc in get_retriever(video_id, k=TOP_K).invoke(state["query"]):
        chunks[doc.metadata["chunk_index"]] = doc.page_content

    intro = vector_store.get(ids=[f"{video_id}_{i}" for i in range(INTRO_CHUNKS)])
    for text, meta in zip(intro["documents"], intro["metadatas"]):
        chunks[meta["chunk_index"]] = text

    context = "\n\n".join(chunks[i] for i in sorted(chunks))
    return {"context": context}


def generate(state: ChatState):
    system_prompt = (
        "You answer questions about a YouTube video using only the transcript "
        "excerpts below. The excerpts may be in Hindi, Hinglish or another language. "
        "Answer in the same language as the user's question. "
        "If the answer is not in the excerpts, say you could not find it in the video.\n\n"
        f"Transcript excerpts:\n{state['context']}"
    )
    response = llm.invoke([SystemMessage(system_prompt)] + state["messages"])
    return {"messages": [response]}


builder = StateGraph(ChatState)
builder.add_node("rewrite_query", rewrite_query)
builder.add_node("retrieve", retrieve)
builder.add_node("generate", generate)
builder.add_edge(START, "rewrite_query")
builder.add_edge("rewrite_query", "retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", END)

graph = builder.compile(checkpointer=InMemorySaver())


def get_video_title(url, video_id):
    try:
        response = requests.get(
            "https://www.youtube.com/oembed",
            params={"url": url, "format": "json"},
            timeout=10,
        )
        return response.json()["title"]
    except Exception:
        return f"Video {video_id}"


def create_chat(url):
    video_id = index_video(url)
    chat = {
        "thread_id": str(uuid.uuid4()),
        "video_id": video_id,
        "title": get_video_title(url, video_id),
        "url": url,
    }
    chats[chat["thread_id"]] = chat
    return chat


def list_chats():
    return list(chats.values())


def ask(thread_id, question):
    chat = chats[thread_id]
    result = graph.invoke(
        {"messages": [HumanMessage(question)], "video_id": chat["video_id"]},
        config={"configurable": {"thread_id": thread_id}},
    )
    return to_text(result["messages"][-1].content)


def get_history(thread_id):
    state = graph.get_state({"configurable": {"thread_id": thread_id}})
    messages = state.values.get("messages", [])
    return [
        {
            "role": "user" if m.type == "human" else "assistant",
            "content": to_text(m.content),
        }
        for m in messages
    ]


if __name__ == "__main__":
    chat = create_chat(input("YouTube link: "))
    print("Chat:", chat["title"], "|", chat["thread_id"])

    while True:
        question = input("\nYou (empty to quit): ")
        if not question:
            break
        print("\nBot:", ask(chat["thread_id"], question))