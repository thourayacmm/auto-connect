import json
import wave
from functools import lru_cache
from pathlib import Path

from vosk import KaldiRecognizer, Model


BASE_DIR = Path(__file__).resolve().parent
LEGACY_MODELS_DIR = BASE_DIR / "models"

MODEL_CANDIDATES = {
    "fr": [
        LEGACY_MODELS_DIR / "vosk-model-small-fr-0.22",
    ],
    "en": [
        LEGACY_MODELS_DIR / "vosk-model-small-en-us-0.15",
    ],
}


def _normalize_language(language: str | None) -> str:
    value = str(language or "fr").strip().lower()
    return "fr" if value.startswith("fr") else "en"


def _resolve_model_path(language: str) -> Path:
    for candidate in MODEL_CANDIDATES[language]:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Aucun modele Vosk disponible pour la langue '{language}'.")


@lru_cache(maxsize=4)
def _load_model(language: str) -> Model:
    model_path = _resolve_model_path(language)
    return Model(str(model_path))


def _validate_wave_file(wave_file: wave.Wave_read) -> None:
    sample_width = wave_file.getsampwidth()
    channel_count = wave_file.getnchannels()

    if sample_width != 2:
        raise ValueError("Le fichier audio doit etre encode en PCM 16 bits.")
    if channel_count != 1:
        raise ValueError("Le fichier audio doit etre mono.")


def transcrire_audio(chemin_fichier: str, language: str = "fr") -> str:
    selected_language = _normalize_language(language)
    model = _load_model(selected_language)

    with wave.open(chemin_fichier, "rb") as wave_file:
        _validate_wave_file(wave_file)
        recognizer = KaldiRecognizer(model, wave_file.getframerate())

        result_text = ""
        while True:
            data = wave_file.readframes(4000)
            if not data:
                break
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                result_text += f"{result.get('text', '')} "

        final_result = json.loads(recognizer.FinalResult())
        result_text += final_result.get("text", "")

    return result_text.strip()
