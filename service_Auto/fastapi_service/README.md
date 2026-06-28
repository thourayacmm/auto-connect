# AUTO CONNECT FastAPI AI Service

Service FastAPI unique pour remplacer les anciens petits services Python:

- correction de phrase: `POST /ai/correct-phrase`
- recommandations IA: `POST /ai/generate-recommendations`
- chat FAQ/RAG: `POST /ai/rag/query`
- analyse, score et adaptation de niveau
- compatibilite anciens endpoints: `POST /correct_api`, `POST /stt`
- STT Vosk integre avec selection de langue (`fr` par defaut, `en` supporte)

## Installation

```powershell
cd service_Auto\fastapi_service
python3 -m venv .venv
.\.venv\Scripts\Activate.ps1. 

source .venv/bin/activate


python -m pip install -r requirements.txt
```

## Modele Ollama pour la correction

La correction orthographique generale utilise Ollama avec `llama3.1:8b` comme modele principal.
Installez-le avant de lancer le service:

```bash
ollama pull llama3.1:8b
```

Un fallback IA vers `mistral` existe si le modele principal manque, mais `llama3.1:8b` est recommande pour la correction francaise generale.

## Lancement

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8011
```

Depuis `cmd.exe`, vous pouvez aussi lancer directement:

```bat
run_fastapi.bat
```

Health check:

```text
http://127.0.0.1:8011/ai/health
```

Pour le rechargement automatique en developpement:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8011 --reload
```

Sur certaines machines Windows, `--reload` peut provoquer `PermissionError: [WinError 5]`.

## Integration backend Node

Dans `backend\.env`:

```env
FASTAPI_BASE_URL=http://127.0.0.1:8011
FASTAPI_TIMEOUT_MS=10000
```

Puis lancer le backend:

```powershell
cd backend
npm run dev
```

Le backend Node appelle ensuite FastAPI via:

- `POST /api/ai/recommend` -> FastAPI `/ai/generate-recommendations`
- `POST /api/ai/chat` -> FastAPI `/ai/rag/query`
- `POST /api/ai/correct-phrase` -> FastAPI `/ai/correct-phrase`

## Integration frontend

Le frontend peut appeler FastAPI directement en dev avec:

```env
VITE_FASTAPI_BASE_URL=http://127.0.0.1:8011
```

ou rester sur la valeur par defaut `http://127.0.0.1:8011`.

## Notes STT

- Le frontend enfant envoie maintenant un fichier audio WAV mono PCM 16 bits a `POST /api/ai/stt`.
- Le backend Node relaie ensuite ce fichier vers FastAPI `POST /stt` avec le champ `language`.
- Les modeles Vosk utilises par le service sont charges depuis `service_Auto\api_stt\models` pour eviter les problemes Windows de chemins avec espaces.
