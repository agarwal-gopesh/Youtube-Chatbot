#!/bin/bash
cd "$(dirname "$0")"
source ../langchain_venv/bin/activate

ngrok http 8000 > /dev/null &
trap "kill $!" EXIT

caffeinate -i uvicorn api:app --port 8000