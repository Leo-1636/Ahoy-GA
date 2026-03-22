# Ahoy-GA

## Introduction

Ahoy-GA is a training data generation and processing tool. It generates training images using **Gemini (Nano Banana)** and **FLUX**, and provides AI caption generation, cropping, arrow annotation, and other data processing features to support downstream SFT and RL.

---

## Features

- **Image Generation**: Generate training images using Gemini or FLUX.2-klein
- **Caption Generation**: Automatically generate text captions for images using Gemini 3 or GPT-5.4
- **Image Crop**: Select a region on the image to crop and save to the dataset
- **Arrow Annotation**: Draw colored arrows on images to highlight areas of interest
- **Dataset Management**: Manage original images (`original/`) and datasets (`datasets/`) with batch delete support
- **Appearance Settings**: Customize the UI accent color; preferences are saved in browser localStorage

---

## Upcoming

- **Batch Image Generation**: Generate multiple images in a single request using a list of prompts
- **Token Usage Display**: Show the number of tokens consumed per generation request
- **Cost Estimation**: Display estimated API cost based on model pricing and token usage

---

## Model & Hardware Requirements

### Image Generation Models

| Model | Provider | Execution | Requirements |
|-------|----------|-----------|--------------|
| **Nano Banana Pro** | Google Gemini | Cloud | Gemini API Key |
| **Nano Banana 2** | Google Gemini | Cloud | Gemini API Key |
| **FLUX.2-klein 4B** | Black Forest Labs | Local | GPU + CUDA |
| **FLUX.2-klein 9B** | Black Forest Labs | Local | GPU + CUDA |

### Caption Generation Models

| Model | Provider | Requirements |
|-------|----------|--------------|
| **Human** | You | Your Brain and Hand |
| **Gemini 3 Flash** | Google | Gemini API Key |
| **GPT-5.4** | OpenAI | ChatGPT API Key |
| **GPT-5.4 Mini** | OpenAI | ChatGPT API Key |

### Recommended GPU Setup

| Model | Resolution |  VRAM Usage | Recommended GPU |
|-------|------------|-------------|----------------|
| FLUX.2-klein 4B | 1K | ~7.5 GB  | RTX 4060 or above |
| FLUX.2-klein 4B | 2K | ~14.2 GB | RTX 4080 or above |
| FLUX.2-klein 9B | 1K | ~18.5 GB | RTX 4090 or above |

> **Note**: FLUX inference runs locally. If an OOM error occurs, the system automatically catches the exception and returns HTTP 503 without affecting the FastAPI process.

---

## Installation & Setup

### Create Environment (Conda)

```bash
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

The front-end runs at `http://localhost:5173` by default. API requests are proxied to the back-end at `http://localhost:8000` via Vite proxy.

### 3. API Key Configuration

After starting the app, go to the **Settings page** (`/settings`) and enter your keys under the **API Keys** section:

- `Gemini API Key`: Used for Nano Banana image generation and Gemini caption generation
- `ChatGPT API Key`: Used for GPT caption generation

> API Keys are stored in back-end memory and must be re-entered after restarting the server.

---

## Project Structure

```
Ahoy-GA/
├── back-end/
│   ├── api.py              # FastAPI main application
│   ├── config.py           # Model names and path configuration
│   ├── clients/
│   │   ├── flux.py         # FLUX local inference client
│   │   ├── gemini.py       # Gemini image generation client
│   │   ├── gpt.py          # GPT text generation client
│   │   └── message.py      # Message format utilities
│   └── utils/
│       ├── image_util.py   # Image open, save, arrow drawing
│       ├── path_util.py    # Path resolution utilities
│       └── status_util.py  # GPU / CPU status query
├── front-end/
│   └── src/
│       ├── App.tsx         # Main page
│       └── Settings.tsx    # Settings page 
└── storage/
    ├── original/           # Original generated images (.png)
    └── datasets/           # Dataset images and captions (.png + .txt)
```

---

## License

This project is for private use. No license has been declared.
