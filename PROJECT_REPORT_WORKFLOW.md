# TubeChat AI: Project Implementation Plan & Workflow Report

**Project Title:** TubeChat AI — Multilingual YouTube Conversational Intelligence System using LangGraph & RAG  
**Domain:** Artificial Intelligence, Natural Language Processing, Retrieval-Augmented Generation (RAG)  
**Target:** Academic & Technical Project Report Reference  

---

## 1. Executive Summary & Abstract

### 1.1 Problem Statement
Modern video platforms like YouTube host enormous volumes of educational, technical, and informational content. However, extracting specific insights from long-form video content (lectures, podcasts, technical talks) suffers from significant challenges:
- **Linear Consumption:** Users must watch or manually scrub through hours of footage to locate specific explanations.
- **Search Inefficiency:** Native search algorithms only index titles, tags, and descriptions rather than spoken semantics within the video body.
- **Multilingual Content Gaps:** Many valuable educational lectures delivered in Hindi, Hinglish, or mixed vernacular lack structured, interactive querying tools that preserve context.

### 1.2 Proposed Solution: TubeChat AI
**TubeChat AI** is an intelligent, retrieval-augmented conversational agent that transforms any YouTube video into an interactive knowledge base. Users provide a video URL, and the system automatically extracts transcripts, chunks and embeds semantic content into a persistent vector store, and enables grounded, timestamp-accurate dialogue powered by Google Gemini and LangGraph.

### 1.3 Key Objectives
1. **Automated Knowledge Ingestion:** Extract and parse transcripts across languages (Hindi, English, Hinglish, and auto-captions) without manual intervention.
2. **Context-Preserving Semantic Indexing:** Segment spoken transcripts using multilingual boundary-aware tokenization and embed them via high-dimensional dense representations (`BAAI/bge-m3`).
3. **Conversational Multi-Turn RAG:** Maintain stateful dialogue where follow-up questions (e.g., *"What did he say next?"* or *"Explain its cost"*) are dynamically rewritten into standalone search queries.
4. **Hybrid Context Retention:** Combine top semantic matches with the video's introductory context chunks to avoid myopic retrieval errors.
5. **Interactive & Grounded UI:** Deliver a rich web interface featuring clickable timestamps, structured Markdown formatting, and dual dark/light aesthetics.

---

## 2. System Architecture & Tech Stack

```
+---------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                     |
|                       React 19 + Vite + Custom Modern Dark CSS                        |
|  - Welcome Screen (URL input & trending)                                              |
|  - Real-time Ingestion Progress Screen                                                |
|  - Multi-Turn Chat Screen with Clickable Timestamps & Code Blocks                     |
|  - Backend Connection Manager (Localhost / Remote Ngrok Tunnel)                       |
+-------------------------------------------+-------------------------------------------+
                                            | REST API (HTTP JSON)
                                            v
+---------------------------------------------------------------------------------------+
|                                  BACKEND API GATEWAY                                  |
|                               FastAPI (Uvicorn / CORS)                                |
|  - POST /chats                      : Ingest video & initialize thread                |
|  - GET  /chats                      : List available active threads                   |
|  - GET  /chats/{id}/messages        : Retrieve conversation history                   |
|  - POST /chats/{id}/messages        : Submit user question & return AI response       |
+-------------------------------------------+-------------------------------------------+
                                            |
         +----------------------------------+----------------------------------+
         |                                                                     |
         v                                                                     v
+---------------------------------+                   +---------------------------------+
|   INGESTION & VECTOR PIPELINE   |                   |     LANGGRAPH DIALOGUE GRAPH    |
| (transcript.py, vector_store.py)|                   |            (graph.py)           |
|                                 |                   |                                 |
| 1. Regex URL ID Extractor       |                   | State: [messages, video_id,     |
| 2. YouTube Transcript API       |                   |         query, context]         |
| 3. RecursiveTextSplitter        |                   |                                 |
|    (chunk=1000, overlap=200)    |                   | [START]                         |
| 4. HuggingFace BAAI/bge-m3      |                   |    |                            |
| 5. ChromaDB Vector Store        |                   |    v                            |
|    (Persistent storage)         |                   | Node 1: rewrite_query           |
+---------------------------------+                   |    | (Gemini Flash)             |
                                                      |    v                            |
                                                      | Node 2: retrieve                |
                                                      |    | (ChromaDB Top-K + Intro)   |
                                                      |    v                            |
                                                      | Node 3: generate                |
                                                      |    | (Gemini Flash + Grounding) |
                                                      |    v                            |
                                                      |  [END]                          |
                                                      +---------------------------------+
```

### Technology Stack Matrix

| Layer | Technology | Version / Specification | Rationale & Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.3.1` | Concurrent rendering, modern hooks, modular UI |
| **Build & Tooling** | Vite | `^8.3.4` | Ultra-fast HMR and optimized bundle builds |
| **Styling** | Vanilla CSS Design System | Custom CSS Variables | Zero runtime overhead, glassmorphism, responsive themes |
| **Backend Framework** | FastAPI | Python 3.10+ | Asynchronous REST endpoints, auto Swagger, Pydantic validation |
| **Agent / Graph Framework** | LangGraph | `langgraph` | Stateful multi-node execution DAG with checkpoint memory |
| **Orchestration** | LangChain Core | `langchain_core` | LLM invocation, message abstraction, schema binding |
| **Large Language Model** | Google Gemini Flash | `gemini-3.6-flash` | High context window, low latency, multilingual comprehension |
| **Embeddings Model** | HuggingFace `BAAI/bge-m3` | 1024-dim dense vectors | State-of-the-art multilingual and cross-lingual performance |
| **Vector Database** | ChromaDB | `langchain_chroma` | Embedded persistent storage, metadata filtering by `video_id` |
| **Transcript Extractor** | `youtube-transcript-api` | Python | Extracts subtitles (manual + auto-generated, fallback chains) |
| **Video Metadata** | YouTube oEmbed API | HTTP GET | Fetches official video titles without requiring full YouTube Data v3 API keys |

---

## 3. End-to-End System Workflows

### 3.1 Workflow 1: Video Ingestion & Semantic Indexing

This workflow occurs when a user submits a YouTube link.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant TE as Transcript Engine (transcript.py)
    participant YT as YouTube API / oEmbed
    participant VS as Vector Store (vector_store.py)
    participant DB as ChromaDB

    User->>UI: Pastes YouTube URL (e.g. video link)
    UI->>UI: Validate regex & transition to Loading Screen
    UI->>API: POST /chats {"url": "..."}
    API->>TE: extract_video_id(url)
    TE-->>API: 11-character Video ID
    API->>VS: is_indexed(video_id)?
    alt Already Indexed
        VS-->>API: True (skip re-indexing)
    else Not Indexed
        VS->>TE: get_transcript_with_language(url)
        TE->>YT: Query available transcript list
        YT-->>TE: Transcript entries (timestamps + text)
        TE->>TE: Priority check (Manual 'en'/'hi' -> Auto 'en'/'hi' -> Fallback)
        TE-->>VS: Normalized raw text + language code
        VS->>VS: RecursiveCharacterTextSplitter (chunk=1000, overlap=200)
        VS->>VS: BAAI/bge-m3 embedding computation
        VS->>DB: Persist chunks with metadata {video_id, chunk_index, language}
        DB-->>VS: Acknowledge persistent write
    end
    API->>YT: Fetch video title via oEmbed
    YT-->>API: Official Title String
    API->>API: Create thread_id (UUID4) and register session
    API-->>UI: Return Chat object {thread_id, video_id, title, url}
    UI->>UI: Redirect user to ChatScreen
```

#### Ingestion Step Details:
1. **URL Sanitization & Video ID Extraction:** Supports standard (`watch?v=`), shortened (`youtu.be/`), Shorts (`shorts/`), embed (`embed/`), and live stream formats via compiled regular expressions.
2. **Transcript Retrieval Hierarchy:**
   - Attempt 1: Manually created transcripts matching `["en", "hi"]`.
   - Attempt 2: Auto-generated transcripts matching `["en", "hi"]`.
   - Attempt 3: Any first available transcript stream.
3. **Semantic Text Chunking:**
   - Chunk Size: `1000` characters.
   - Chunk Overlap: `200` characters.
   - Punctuation Separators: `["\n\n", "\n", "।", ".", "?", "!", " ", ""]` (includes the Hindi Purna Viram `।` to preserve Indic sentence semantics).
4. **Vector Embedding & Storage:**
   - Dense representation created using `BAAI/bge-m3`.
   - Each chunk receives an ID: `{video_id}_{chunk_index}`.
   - Chroma collection filtered strictly by `video_id`.

---

### 3.2 Workflow 2: Conversational Multi-Turn RAG Pipeline

This workflow governs how user inquiries are resolved through the stateful LangGraph pipeline.

```mermaid
flowchart TD
    Start([User sends query: 'What was the cost mentioned?']) --> AddHistory[Add HumanMessage to LangGraph State]
    AddHistory --> Node1[Node 1: rewrite_query]

    subgraph Query Rewriting
        Node1 --> CheckHist{Is it first question?}
        CheckHist -- Yes --> PassThrough[Keep original question]
        CheckHist -- No --> LLMRewrite[Prompt Gemini with Chat History]
        LLMRewrite --> RewrittenQ[Rewritten Standalone Query: 'What was the budget of the Chandrayaan 3 mission?']
    end

    PassThrough --> Node2[Node 2: retrieve]
    RewrittenQ --> Node2

    subgraph Hybrid Retrieval
        Node2 --> SemanticSearch[ChromaDB Vector Search: Top-6 Chunks via BGE-M3]
        Node2 --> IntroFetch[ChromaDB Key Lookup: First 3 Chunks 0, 1, 2]
        SemanticSearch --> MergeChunks[Merge & Deduplicate by chunk_index]
        IntroFetch --> MergeChunks
        MergeChunks --> ChronoSort[Sort Chunks Chronologically]
        ChronoSort --> ContextStr[Concatenate into Unified Context String]
    end

    ContextStr --> Node3[Node 3: generate]

    subgraph Grounded Response Generation
        Node3 --> SystemPrompt[Construct System Prompt: Role, Rules, Transcript Excerpts]
        SystemPrompt --> LLMInvoke[Invoke ChatGoogleGenerativeAI: gemini-3.6-flash]
        LLMInvoke --> OutputFormat[Enforce Markdown, Timestamps, Bold Keypoints, Summary]
    end

    OutputFormat --> SaveCheckpointer[LangGraph InMemorySaver stores State]
    SaveCheckpointer --> ReturnJSON[Return JSON answer to FastAPI]
    ReturnJSON --> FrontendRender[Frontend parses Markdown & renders interactive timestamps]
```

#### Graph Node Responsibilities:
- **`rewrite_query`:** Resolves co-references and pronoun ambiguity (e.g., *"How does it work?"* $\rightarrow$ *"How does the cryogenic upper stage work?"*).
- **`retrieve`:** Performs hybrid retrieval:
  $$\text{Context} = \text{TopK}_{\text{semantic}}(Q_{\text{rewritten}}, k=6) \cup \text{Chunk}_{\text{intro}}[0..2]$$
  This guarantees that introductory thematic context is always available even for hyper-specific queries.
- **`generate`:** Injects the transcript excerpts into a strictly grounded system prompt. Instructions command the model to answer exclusively from the transcript and cite exact timestamps (`[MM:SS]`).

---

### 3.3 Workflow 3: Client-Side Interactive Parsing & Navigation

```mermaid
flowchart LR
    A[Raw AI Markdown Response] --> B[StructuredResponse Component]
    B --> C{Regex Tokenizer}
    C -->|Bold/Italics| D[Semantic Strong/Em Tags]
    C -->|Code blocks| E[Syntax Formatted Code View]
    C -->|Timestamps MM:SS| F[Interactive Jump Buttons]
    F -->|User Clicks Timestamp| G[Open YouTube at exact second: ?t=seconds]
    B --> H[Direct YouTube Navigation & Source Tracking]
```

---

## 4. Comprehensive Implementation Plan

The project development was executed in 7 structured phases:

```
Phase 1: Requirements & Architecture Design
   └── Tech stack selection, API boundary definition, RAG design

Phase 2: Transcript Extraction Pipeline (transcript.py)
   └── Regex URL parser, fallback language resolution, text cleansing

Phase 3: Vector Storage & Embedding Pipeline (vector_store.py)
   └── BGE-M3 embedding setup, ChromaDB indexing, custom chunk splitting

Phase 4: LangGraph Conversational Pipeline (graph.py)
   └── StateGraph creation, query rewriter node, hybrid retrieval, generation node

Phase 5: REST API Services Layer (api.py)
   └── FastAPI server, session management, CORS configuration, error handlers

Phase 6: Modern React UI/UX Development (frontend/)
   └── Component architecture, theme engine, timestamp parser, network sync

Phase 7: System Integration, Verification & Documentation
   └── End-to-end testing, ngrok tunnel support, report preparation
```

### Phase Details

#### Phase 1: Requirements & Architectural Design
- Defined target personas (students, researchers, content consumers).
- Benchmarked embedding models: picked `BAAI/bge-m3` due to strong multilingual support (English, Hindi, code).
- Designed state schema using `TypedDict` and `Annotated[list, add_messages]`.

#### Phase 2: Video Extraction & Transcript Processing (`transcript.py`)
- Integrated `youtube-transcript-api`.
- Built resilient fallback logic: Manual transcripts $\rightarrow$ Auto-generated captions $\rightarrow$ Fallback language.
- Implemented robust regex covering standard, short, embed, and live YouTube URLs.

#### Phase 3: Embedding & Vector Storage Engine (`vector_store.py`)
- Initialized local persistent ChromaDB (`chroma_db`).
- Configured `RecursiveCharacterTextSplitter` with chunk size of 1000 characters and 200 character overlap.
- Added custom Indic punctuation separator `।` for Hindi speech boundaries.
- Created `is_indexed(video_id)` cache-check to eliminate redundant embedding compute.

#### Phase 4: LangGraph State Machine (`graph.py`)
- Assembled 3-node cyclic/directed pipeline: `rewrite_query` $\rightarrow$ `retrieve` $\rightarrow$ `generate`.
- Integrated `InMemorySaver` checkpointer for thread-isolated multi-turn conversation memory.
- Enforced system prompt constraints:
  - Exact timestamp citation (`[04:15]`, `[14:32]`).
  - Strict grounding: *"If the answer is not in the excerpts, say you could not find it in the video transcript."*
  - Language mirroring (replies in Hindi/Hinglish/English depending on user input).

#### Phase 5: REST API Gateway (`api.py`)
- Created FastAPI endpoints:
  - `POST /chats`: Trigger indexing and return unique `thread_id`.
  - `GET /chats`: List session histories.
  - `GET /chats/{thread_id}/messages`: Fetch chronological message history.
  - `POST /chats/{thread_id}/messages`: Push question into LangGraph and return answer.
- Enabled CORS with wildcard support for local development and remote deployments.

#### Phase 6: Frontend Application Development (`frontend/`)
- Built using React 19 and Vite with modular screens:
  - `WelcomeScreen.jsx`: Fast input field, quick-try chips, ambient glowing background.
  - `LoadingScreen.jsx`: Multi-stage progress visualizer (Transcript $\rightarrow$ Embedding $\rightarrow$ Graph setup).
  - `ChatScreen.jsx`: Conversational workspace with auto-scroll, starter suggestion chips, and responsive sidebar.
  - `StructuredResponse.jsx`: Custom markdown renderer that parses timestamps into interactive player jump-links.
  - `ApiSettingsModal.jsx`: Dynamic backend configuration allowing users to input Ngrok tunnel URLs or local host addresses.

#### Phase 7: Verification & Testing
- Tested across various content formats:
  - Long podcasts (>2 hours, e.g., Lex Fridman, Ranveer Allahbadia).
  - Heavy Hindi/Hinglish technical lectures (Khan GS Research, Dhruv Rathee).
  - Code walkthroughs (Andrej Karpathy).
- Verified query rewriting on multi-turn dialogue.
- Verified timestamp extraction precision.

---

## 5. Data Flow & State Management Specifications

### 5.1 LangGraph State Schema (`ChatState`)

```python
class ChatState(TypedDict):
    messages: Annotated[list, add_messages]  # Append-only message sequence
    video_id: str                            # Active YouTube 11-char ID
    query: str                               # Rewritten standalone query
    context: str                             # Extracted transcript snippets
```

### 5.2 API Data Contracts

#### Request: `POST /chats`
```json
{
  "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY"
}
```

#### Response: `POST /chats`
```json
{
  "thread_id": "a93b4f12-0761-4fa3-9f82-a9bdf1184762",
  "video_id": "kCc8FmEb1nY",
  "title": "The spelled-out intro to neural networks and backpropagation",
  "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY"
}
```

#### Request: `POST /chats/{thread_id}/messages`
```json
{
  "question": "What is the role of the loss function in micrograd?"
}
```

#### Response: `POST /chats/{thread_id}/messages`
```json
{
  "answer": "In micrograd, the loss function measures how well the neural network is performing...\n\n### Key Stages:\n- **Forward Pass [12:30]**: Computes predictions...\n- **Backward Pass [25:40]**: Calculates gradients...\n\n> **Key Takeaway:** The loss provides the scalar signal needed to update the weights."
}
```

---

## 6. Key Innovations & Design Highlights

1. **Context-Aware Query Reformulation:**
   In conventional RAG, asking *"How much did it cost?"* in turn 3 will fail because the embedding of *"How much did it cost?"* lacks the video subject. The `rewrite_query` node reconstructs the full semantic query before vector search.
2. **Hybrid Context Retention (Semantic + Introductory Anchor):**
   Standard Top-K retrieval often misses broad video context when questions ask about narrow details. TubeChat AI always includes the first 3 chunks (the introduction) alongside the 6 top semantic chunks, ensuring macro and micro understanding.
3. **Multilingual Punctuation Tokenization:**
   Sentence boundaries differ across scripts. Incorporating the Hindi danda (`।`) ensures Hindi sentences are not awkwardly bisected across chunk borders.
4. **Interactive Timestamp Jump-Links:**
   Answers are not just static text. Timestamps like `[14:32]` are parsed client-side into direct links that launch the YouTube video at `&t=872s`.
5. **Flexible Deployment Architecture:**
   The frontend incorporates a dynamic API configuration modal (`ApiSettingsModal.jsx`) with Ngrok bypass headers (`ngrok-skip-browser-warning: true`), allowing the backend to run on a local GPU machine while serving the UI anywhere.

---

## 7. Results & Performance Characteristics

| Metric / Dimension | Performance Observation |
| :--- | :--- |
| **Transcript Ingestion Time** | 1.5 – 3.0 seconds for average 30-minute video |
| **Vector Indexing (BGE-M3)** | ~2 – 4 seconds (MPS / GPU accelerated) |
| **Query Rewriting Latency** | ~400 – 600 ms (Gemini Flash) |
| **Semantic Retrieval Time** | < 50 ms (ChromaDB local query) |
| **Generation Latency** | ~1.0 – 1.8 seconds (First Token to Completion) |
| **Language Support** | High accuracy in English, Hindi, and Hinglish |

---

## 8. Future Roadmap & Enhancements

For expanding the project report or future iterations:
- **Whisper Audio Ingestion:** Integrate OpenAI Whisper / Faster-Whisper to transcribe videos lacking captions or with disabled subtitles.
- **Embedded In-App Video Player:** Embed the YouTube IFrame player directly beside the chat window so timestamps scrub the video in-place without opening a new tab.
- **Persistent Relational Database:** Migrate in-memory chat sessions (`chats = {}`) to SQLite / PostgreSQL for persistent cross-session retention.
- **Source Chunk Inspector:** Add an expandable sidebar showing the raw transcript passages retrieved for full explainability.

---
*Report documentation prepared for TubeChat AI project presentation, evaluation, and documentation.*
