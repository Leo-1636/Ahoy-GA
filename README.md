# Ahoy-GA

AI 生成資料工具：集中管理原始圖與資料集，以 **Gemini / Flux** 生成圖片、以 GPT 生成標籤，並支援裁剪、箭頭標註與標籤儲存。

## 環境需求

- Python 3.x  
- Node.js  
- **NVIDIA Driver** 與 **CUDA**（使用 Flux 本地生成圖片時需要；僅用 Gemini 可省略）

## 安裝與執行

### 一鍵啟動（前端 + 後端）

在專案根目錄執行下列指令，會同時啟動後端（port 8000）與前端開發伺服器：

```bash
python run.py
```

適用 Linux 與 Windows。結束時在終端按 `Ctrl+C` 會一併關閉前後端。  
（首次請先依下方「後端」「前端」完成 `pip install`、`npm install`。）

### 1. 後端

```bash
cd back-end
pip install -r ../requirement.txt
```

在專案根目錄建立 `.env`，並設定 API 金鑰：

```env
GOOGLE_API_KEY=你的_Google_API_金鑰
OPENAI_API_KEY=你的_OpenAI_API_金鑰
```

啟動後端：

```bash
cd back-end
python main.py
```

或使用 uvicorn：

```bash
uvicorn main:app --reload --port 8000
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

目錄不存在時會依需要建立。

## 授權

專案為私人使用，未另行聲明授權條款。
