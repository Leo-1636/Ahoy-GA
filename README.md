# Ahoy-GA

AI 生成資料工具：  
集中管理原始圖與資料集，以 **Gemini / Flux** 生成圖片、以 GPT 生成標籤，並支援裁剪、箭頭標註與標籤儲存。

## 環境需求

- Python 3.x  
- Node.js  
- **NVIDIA Driver** 與 **CUDA 12.9** 以上  
  [NVIDIA Driver](https://www.nvidia.com/drivers/) · [NVIDIA CUDA](https://developer.nvidia.com/cuda-downloads/)

## 使用模型與硬體需求

| 用途 | 模型 | 說明 | 硬體 / VRAM |
|------|------|------|-------------|
| 圖片生成 <br>（雲端） | **Google NanoBanana Pro** <br>（`gemini-3-pro-image-preview`） | 依提示詞與參考圖生成 4K 圖片 <br> 需 `GOOGLE_API_KEY` | 不需本地 GPU |
| 圖片生成 <br>（本地） | **FLUX.2-klein** <br>（Black Forest Labs） | 依提示詞與參考圖生成 1K 圖片 <br> 需 CUDA | **Flux 4B** 至少 8GB VRAM <br> **Flux 9B** 至少 20GB VRAM |
| 標籤生成 | **OpenAI GPT** <br>（`gpt-5.2-2025-12-11`） | 依圖片與提示詞生成標籤 <br> 需 `OPENAI_API_KEY` | 不需本地  GPU |

Generate Image 可切換 **Gemini** 或 **Flux** 作為圖片生成來源；Tag 功能可以選擇使用 **GPT** 或人為標註。  
僅用 Gemini 時無須本地 GPU；使用 Flux 時程式會依目前顯存自動選擇 9B 或 4B 模型。

### 實測效果
單張生成時間，僅供參考：
| 環境 | 約略耗時 |
|------|----------|
| Gemini NanoBanana Pro  | 約 30 秒 |
| RTX 4090 + Flux.2-klein 9B | 約 16 秒 |
| RTX 4060 筆電 + Flux.2-klein 4B | 約 260 秒 |

## 安裝與執行

### 快速啟動（前端 + 後端）

在專案根目錄執行下列指令，會同時啟動後端（port 8000）與前端開發伺服器：

```bash
python main.py
```

首次請先依下方「後端」「前端」完成 `pip install`、`npm install`。

### 1. 後端

```bash
cd back-end
pip install -r requirement.txt
```

在專案根目錄建立 `.env`，並設定 API 金鑰：

```env
GOOGLE_API_KEY=你的_Google_API_金鑰
OPENAI_API_KEY=你的_OpenAI_API_金鑰
```

啟動後端：

```bash
cd back-end
python api.py
```

或使用 uvicorn：

```bash
cd back-end
uvicorn api:app --reload --port 8000
```

### 2. 前端

```bash
cd front-end
npm install
npm run dev
```

### 3. 儲存目錄

後端會使用 `back-end/storage/` 下的目錄：

- `storage/originals/`：原始圖片（.png）
- `storage/datasets/`：資料集圖片與對應標籤（.png + .txt）

## 授權

專案為私人使用，未另行聲明授權條款。
