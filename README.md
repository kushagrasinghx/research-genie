# AI-Powered Research Assistant

Full setup guide to run the frontend and backend locally.

## 1) Prerequisites

- Node.js 20+ and npm
- Python 3.12+ and pip
- A Gemini API key

## 2) Clone and open project

```bash
git clone <your-repo-url>
cd ai-powered-research-assistant
```

## 3) Backend setup (FastAPI)

From the project root:

```bash
cd backend
```

Create env file:

```bash
copy .env.example .env
```

Open `backend/.env` and set:

```env
GEMINI_API_KEY=your-real-gemini-api-key
```

Create virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API: http://localhost:8000
- Health check: http://localhost:8000/health
- Swagger docs: http://localhost:8000/docs

## 4) Frontend setup (Next.js)

Open a second terminal, from project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Ensure frontend env is present (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start frontend dev server:

```bash
npm run dev
```

Frontend URL:

- App: http://localhost:3000

## 5) Run both together

Keep both terminals running:

- Terminal 1: backend on port `8000`
- Terminal 2: frontend on port `3000`

Then open:

- http://localhost:3000

## 6) Quick troubleshooting

- **Backend fails to start**: verify `backend/.env` has a valid `GEMINI_API_KEY`.
- **CORS/API errors in browser**: confirm frontend points to `http://localhost:8000` in `frontend/.env.local`.
- **Port already in use**: stop the conflicting process or change port and update `NEXT_PUBLIC_API_URL`.
- **Python command not found**: install Python and reopen terminal.
- **Node command not found**: install Node.js 20+ and reopen terminal.

## 7) Optional: backend with Docker

From the `backend` folder:

```bash
docker build -t research-assistant-backend .
docker run --rm -p 8000:8000 --env-file .env research-assistant-backend
```

Use this only for backend; frontend still runs with `npm run dev` in `frontend`.
