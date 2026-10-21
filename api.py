from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from graph import chats, create_chat, list_chats, ask, get_history

app = FastAPI(title="YouTube Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class NewChat(BaseModel):
    url: str


class Question(BaseModel):
    question: str


def check_chat(thread_id):
    if thread_id not in chats:
        raise HTTPException(status_code=404, detail="Chat not found")


@app.post("/chats")
def new_chat(body: NewChat):
    try:
        return create_chat(body.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not create chat: {e}")


@app.get("/chats")
def get_chats():
    return list_chats()


@app.get("/chats/{thread_id}/messages")
def get_messages(thread_id: str):
    check_chat(thread_id)
    return get_history(thread_id)


@app.post("/chats/{thread_id}/messages")
def send_message(thread_id: str, body: Question):
    check_chat(thread_id)
    return {"answer": ask(thread_id, body.question)}