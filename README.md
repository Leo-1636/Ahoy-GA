# Ahoy-GA

## Introduction

Ahoy-GA is a training data generation and processing tool. It generates training images using **Gemini (Nano Banana)**, **GPT Image 2**, and **FLUX**, and provides AI caption generation, cropping, arrow annotation, import, and other data processing features to support downstream SFT and RL.

---

## Features

- **Image Generation**: Generate images via Gemini, GPT Image 2 (cloud), or FLUX.2-klein (local)
- **Caption Generation**: Auto-generate or manually edit `.txt` captions (Gemini 3 Flash, GPT-5.4 Mini)
- **Image Crop**: Drag to select a region, confirm, then save to `datasets/`
- **Arrow Annotation**: Draw colored arrows on images, confirm, then save `datasets/`
- **Image Import**: Upload local images into `original/`
- **Dataset Management**: Manage `original/` and `datasets/` with multi-select delete

---

## Upcoming

- **Batch Image Generation**: Generate multiple images in a single request using a list of prompts
- **Token Usage Display**: Show the number of tokens consumed per generation request
- **Cost Estimation**: Display estimated API cost based on model pricing and token usage
- **Dataset Export**: Export `datasets/` to a user-specified folder

---

## Model & Hardware Requirements

### Image Generation Models

| Model | Provider | Execution | Requirements |
|-------|----------|-----------|--------------|
| **Nano Banana Pro** | Google Gemini | Cloud | `GOOGLE_API_KEY` |
| **Nano Banana 2** | Google Gemini | Cloud | `GOOGLE_API_KEY` |
| **GPT Image 2** | OpenAI | Cloud | `OPENAI_API_KEY` |
| **FLUX.2-klein 4B** | Black Forest Labs | Local | GPU + CUDA |
| **FLUX.2-klein 9B** | Black Forest Labs | Local | GPU + CUDA |

### Caption Generation Models

| Model | Provider | Requirements |
|-------|----------|--------------|
| **Manual** | You | Your Brain and Hands |
| **Gemini 3 Flash** | Google | `GOOGLE_API_KEY` |
| **GPT-5.4 Mini** | OpenAI | `OPENAI_API_KEY` |

### Recommended GPU Setup

| Model | Resolution |  VRAM Usage | Recommended GPU |
|-------|------------|-------------|----------------|
| FLUX.2-klein 4B | 1K | ~7.5 GB  | RTX 4060 or above |
| FLUX.2-klein 4B | 2K | ~14.0 GB | RTX 4080 or above |
| FLUX.2-klein 9B | 1K | ~18.5 GB | RTX 4090 or above |

> **Note**: FLUX inference runs locally. If an OOM error occurs, the system automatically catches the exception and returns HTTP 503 without affecting the FastAPI process.

---

## Installation & Setup

### Create Environment (Conda)

```bash
cd Ahoy-GA
conda create --name Ahoy-GA python=3.13
conda activate Ahoy-GA
conda install cuda -c nvidia
```

### 1. Back-end

```bash
cd back-end
pip install -r requirement.txt
python api.py
```

Or using uvicorn:

```bash
cd back-end
uvicorn api:app --reload --port 8000
```

### 2. Front-end

```bash
cd front-end
npm install
npm run dev
```

The front-end runs at `http://localhost:5173` by default. API requests are proxied to the back-end at `http://localhost:8000` via the Vite dev proxy.

### 3. API Key Configuration

Click **⚙ Settings** in the sidebar and enter keys under **API Keys**:

- **Gemini API Key** → stored as `GOOGLE_API_KEY` (Nano Banana image + Gemini text/caption)
- **ChatGPT API Key** → stored as `OPENAI_API_KEY` (GPT Image 2 + GPT text/caption)

Keys are written to `back-end/.env` and loaded into memory; restart the server after changing keys if the process was already running.

---

## Project Structure

```
Ahoy-GA/
├── back-end/
│   ├── api.py              # FastAPI application
│   ├── config.py           # Paths, API keys, model IDs
│   ├── requirement.txt
│   ├── clients/
│   │   ├── flux.py         # FLUX Image
│   │   ├── gemini.py       # Gemini text & image
│   │   └── gpt.py          # ChatGPT text & image
│   ├── runtime/
│   │   ├── messages.py     # LangChain message helpers
│   │   └── status.py       # GPU / VRAM status
│   ├── utils/
│   │   ├── image_io.py     # Image I/O, crop, arrows
│   │   └── path_io.py      # Paths and timestamps
│   └── workspace/
│       ├── original/       # Imported & source images
│       └── datasets/       # Processed images + captions 
├── front-end/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       └── lib/
└── README.md
```

---

## License


