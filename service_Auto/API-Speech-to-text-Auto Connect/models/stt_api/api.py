import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from vosk import Model, KaldiRecognizer
import uvicorn


app = FastAPI()

# =========================
# Charger modèle Vosk
# =========================
MODEL_PATH = "models/vosk-model-small-en-us-0.15"

print("Chargement du modèle...")
model = Model(MODEL_PATH)
print("Modèle chargé ✔")

# =========================
# Route HTML
# =========================
@app.get("/")
async def index():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# =========================
# WebSocket
# =========================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connecté")

    recognizer = KaldiRecognizer(model, 16000)

    try:
        while True:
            data = await websocket.receive_bytes()

            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "")
                await websocket.send_text(text)
            else:
                partial = json.loads(recognizer.PartialResult())
                await websocket.send_text(partial.get("partial", ""))

    except WebSocketDisconnect:
        print("Client déconnecté")

    except Exception as e:
        print("Erreur:", e)
        await websocket.close()


if __name__ == "__main__":

    uvicorn.run(
        "api:app",     # nom_fichier:instance_fastapi
        host="127.0.0.1",
        port=8000,
        reload=True     # auto-reload comme --reload
    )