from __future__ import annotations

import json
import importlib.util
import math
import re
import shutil
import sys
import tempfile
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
CHATBOT_DIR = BASE_DIR.parent / "chatbot"
FAQ_DATASET_PATH = CHATBOT_DIR / "dataset.json"
SERVICE_ROOT = BASE_DIR.parent
OLLAMA_CORRECTOR_PATH = SERVICE_ROOT / "Correction IA" / "_corrector.py"

if str(SERVICE_ROOT) not in sys.path:
    sys.path.append(str(SERVICE_ROOT))


app = FastAPI(title="AUTO CONNECT AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4000",
        "http://127.0.0.1:4000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def unique_strings(values: list[Any]) -> list[str]:
    cleaned = []
    seen = set()
    for value in values:
        text = str(value or "").strip()
        key = text.lower()
        if text and key not in seen:
            cleaned.append(text)
            seen.add(key)
    return cleaned


def merge_phrase_inputs(pictogram_labels: list[str], raw_text: str | None) -> str:
    def canonical_text(value: str) -> str:
        return re.sub(r"\s+", " ", normalize_text(value).replace("'", " ")).strip()

    labels_text = " ".join(str(label or "").strip() for label in pictogram_labels if str(label or "").strip()).strip()
    raw_text_clean = str(raw_text or "").strip()

    if not labels_text:
        return raw_text_clean
    if not raw_text_clean:
        return labels_text

    normalized_labels = canonical_text(labels_text)
    normalized_raw = canonical_text(raw_text_clean)

    if normalized_labels == normalized_raw:
        return raw_text_clean
    if normalized_raw and normalized_raw in normalized_labels:
        return labels_text
    if normalized_labels and normalized_labels in normalized_raw:
        return raw_text_clean

    return f"{labels_text} {raw_text_clean}".strip()


STOP_WORDS = {
    "est",
    "que",
    "qui",
    "quoi",
    "pourquoi",
    "comment",
    "dans",
    "avec",
    "une",
    "des",
    "les",
    "mon",
    "mes",
    "son",
    "ses",
    "aux",
    "pour",
    "enfant",
    "auto",
    "connect",
}


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.lower())
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    normalized = re.sub(r"[^a-z0-9']+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9']{2,}", normalize_text(text))
        if token not in STOP_WORDS
    }


def load_faq_items() -> list[dict[str, str]]:
    if not FAQ_DATASET_PATH.exists():
        return []

    with FAQ_DATASET_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    items = data.get("faq", data if isinstance(data, list) else [])
    return [
        {
            "question": str(item.get("question", "")),
            "answer": str(item.get("answer", "")),
        }
        for item in items
        if isinstance(item, dict)
    ]


FAQ_ITEMS = load_faq_items()
_OLLAMA_CORRECTOR = None


def load_ollama_corrector():
    global _OLLAMA_CORRECTOR
    if _OLLAMA_CORRECTOR is not None:
        return _OLLAMA_CORRECTOR
    if not OLLAMA_CORRECTOR_PATH.exists():
        return None

    spec = importlib.util.spec_from_file_location("auto_connect_ollama_corrector", OLLAMA_CORRECTOR_PATH)
    if spec is None or spec.loader is None:
        return None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _OLLAMA_CORRECTOR = module
    return module


class HealthResponse(BaseModel):
    status: str
    service: str
    faq_items: int


class CorrectPhraseRequest(BaseModel):
    pictogram_labels: list[str] = Field(default_factory=list)
    raw_text: str | None = None
    language: str = "fr"
    age_group: str | None = None


class RecommendationRequest(BaseModel):
    kid_id: str = "general-recommendation"
    age: int = 8
    current_level: str = "Niveau 1"
    recent_categories: list[str] = Field(default_factory=list)
    recent_pictograms: list[str] = Field(default_factory=list)
    previous_recommendations: list[str] = Field(default_factory=list)
    latest_scores: list[float] = Field(default_factory=list)
    objectives: list[str] = Field(default_factory=list)


class RagRequest(BaseModel):
    kid_id: str | None = None
    role: str = "parent"
    query: str
    context_payload: dict[str, Any] = Field(default_factory=dict)
    top_k: int = 4


class AnalyzeRequest(BaseModel):
    kid_id: str = "general-analysis"
    age: int = 8
    current_level: str = "Niveau 1"
    session_id: str | None = None
    pictogram_sequence: list[dict[str, Any]] = Field(default_factory=list)
    scenario_id: str | None = None
    phrase_text: str | None = None
    duration_seconds: float = 0
    timestamps: list[float] = Field(default_factory=list)
    usage_frequency: float = 0
    previous_scores: list[float] = Field(default_factory=list)
    history_summary: str | None = None


class ScoreRequest(BaseModel):
    kid_id: str = "general-score"
    current_level: str = "Niveau 1"
    phrase_count: int = 0
    distinct_pictograms: int = 0
    repeated_pictograms: int = 0
    session_duration: float = 0
    autonomy_indicators: dict[str, Any] = Field(default_factory=dict)
    correction_count: int = 0
    historical_trend: str | None = None


class AdaptLevelRequest(BaseModel):
    kid_id: str = "general-adaptation"
    age: int = 8
    current_level: str = "Niveau 1"
    average_score: float = 0
    progression_trend: float = 0
    consistency_index: float = 0.5
    completed_scenarios: int = 0
    usage_regularity: float = 0.5


def correct_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text.strip())
    if not text:
        return ""

    try:
        corrector = load_ollama_corrector()
        if corrector is not None:
            corrected = corrector.correct_text(text)
            if corrected:
                return corrected
    except Exception:
        pass

    text = text[0].upper() + text[1:]
    word_count = len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ']+", text))
    if re.match(r"(?i)^comment\b", text) and text[-1] not in ".!?":
        text += " ?"
    elif word_count > 1 and text[-1] not in ".!?":
        text += "."
    return text


def score_category(category: str, request: RecommendationRequest) -> int:
    recent_text = " ".join(request.recent_categories + request.recent_pictograms + request.objectives).lower()
    category_lower = category.lower()
    score = request.recent_categories.count(category)
    if category_lower in recent_text:
        score += 2
    return score


def build_recommendations(request: RecommendationRequest) -> dict[str, Any]:
    categories = unique_strings(request.recent_categories) or ["Besoins", "Actions", "Emotions"]
    pictograms = unique_strings(request.recent_pictograms)
    scores = [float(item) for item in request.latest_scores if isinstance(item, (int, float))]
    average_score = sum(scores) / len(scores) if scores else 0

    category_counter = Counter(categories)
    main_category = category_counter.most_common(1)[0][0]
    should_review = average_score and average_score < 60
    level_hint = "Debutant" if request.age <= 7 or should_review else request.current_level

    focus_label = pictograms[0] if pictograms else "J'ai besoin"
    next_label = "Aide-moi" if main_category.lower() in {"besoins", "actions"} else "Je ressens"

    return {
        "recommended_pictograms": [
            {
                "pictogram_id": "ai-focus-1",
                "label": focus_label,
                "category": main_category,
                "reason": "Renforcer un pictogramme deja utilise augmente la confiance et la repetition utile.",
            },
            {
                "pictogram_id": "ai-next-1",
                "label": next_label,
                "category": "Besoins" if main_category != "Besoins" else "Actions",
                "reason": "Ajouter un mot fonctionnel permet de construire des phrases plus autonomes.",
            },
        ],
        "recommended_scenarios": [
            {
                "scenario_id": "routine-5-min",
                "title": "Routine courte de 5 minutes",
                "target_level": level_hint,
                "reason": "Travailler peu de pictogrammes dans une routine familiere limite la charge cognitive.",
            }
        ],
        "adaptation_suggestions": [
            "Commencer par 3 pictogrammes connus, puis ajouter 1 nouveaute.",
            "Garder une consigne courte et valider chaque tentative de communication.",
        ],
        "supervisor_tips": [
            "Observer les categories evitees et les reintroduire dans un moment calme.",
            "Noter les phrases spontanees pour personnaliser la prochaine seance.",
        ],
        "explanation": f"Recommandations basees sur la categorie dominante: {main_category}.",
        "confidence": 0.78 if categories or pictograms else 0.55,
        "caution_note": "Ces suggestions assistent le suivi educatif et ne remplacent pas l'avis d'un professionnel.",
    }


def retrieve_faq(query: str, top_k: int) -> list[dict[str, Any]]:
    normalized_query = normalize_text(query)
    query_tokens = tokenize(query)
    if not query_tokens:
        return []

    scored = []
    for item in FAQ_ITEMS:
        question = item["question"]
        text = f"{question} {item['answer']}"
        item_tokens = tokenize(text)
        overlap = len(query_tokens & item_tokens)
        token_score = overlap / math.sqrt(max(len(query_tokens) * len(item_tokens), 1))
        question_score = SequenceMatcher(None, normalized_query, normalize_text(question)).ratio()
        exact_bonus = 0.35 if normalized_query and normalized_query in normalize_text(question) else 0
        score = max(token_score, question_score) + exact_bonus
        if score >= 0.18:
            scored.append((score, item))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [
        {"score": round(score, 3), "question": item["question"], "answer": item["answer"]}
        for score, item in scored[:top_k]
    ]


@app.get("/", response_model=HealthResponse)
@app.get("/ai/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="auto-connect-fastapi", faq_items=len(FAQ_ITEMS))


@app.post("/ai/correct-phrase")
def correct_phrase(request: CorrectPhraseRequest) -> dict[str, Any]:
    raw = merge_phrase_inputs(request.pictogram_labels, request.raw_text)
    corrected = correct_sentence(raw)
    return {
        "corrected_text": corrected,
        "normalized_text": corrected.lower().rstrip(".!?"),
        "suggestions": [corrected] if corrected else [],
        "explanation": "",
        "confidence": 0.72,
        "caution_note": "",
    }


@app.post("/correct_api")
def legacy_correct_api(text: str = Form(...)) -> dict[str, str]:
    return {"corrected": correct_sentence(text)}


@app.post("/ai/generate-recommendations")
def generate_recommendations(request: RecommendationRequest) -> dict[str, Any]:
    return build_recommendations(request)


@app.post("/ai/rag/query")
def rag_query(request: RagRequest) -> dict[str, Any]:
    chunks = retrieve_faq(request.query, request.top_k)
    if not chunks:
        return {
            "answer": "Je ne sais pas. La question n'est pas assez proche de la FAQ disponible.",
            "retrieved_chunks": [],
            "reasoning_summary": "Aucun passage pertinent trouve dans dataset.json.",
            "recommendations": [
                "Reformuler avec des mots simples lies a l'autisme, la communication ou AutoConnect."
            ],
            "confidence": 0.35,
            "caution_note": "",
        }

    best = chunks[0]
    return {
        "answer": best["answer"],
        "retrieved_chunks": chunks,
        "reasoning_summary": f"Reponse extraite de la FAQ: {best['question']}",
        "recommendations": [
            "Transformer la reponse en une activite courte avec pictogrammes.",
            "Noter la situation reelle de l'enfant pour personnaliser la prochaine recommandation.",
        ],
        "confidence": min(0.9, 0.55 + best["score"]),
        "caution_note": "Pour une decision medicale ou therapeutique, consulter un professionnel.",
    }


@app.post("/ai/analyze-interactions")
def analyze_interactions(request: AnalyzeRequest) -> dict[str, Any]:
    labels = [str(item.get("label", "")) for item in request.pictogram_sequence]
    categories = [str(item.get("category", "General")) for item in request.pictogram_sequence]
    repeated = [label for label, count in Counter(labels).items() if label and count > 1]
    used_categories = unique_strings(categories)

    return {
        "strengths": ["Utilisation reguliere des pictogrammes"] if labels else ["Session prete a analyser"],
        "difficulties": ["Repetitions frequentes"] if repeated else [],
        "repeated_patterns": repeated,
        "used_categories": used_categories,
        "engagement_level": "high" if len(labels) >= 6 else "moderate",
        "summary": f"{len(labels)} pictogrammes utilises dans la session.",
        "suggested_actions": ["Renforcer les categories frequentes", "Ajouter une seule nouveaute a la fois"],
        "confidence": 0.74,
        "caution_note": "",
    }


@app.post("/ai/calculate-score")
def calculate_score(request: ScoreRequest) -> dict[str, Any]:
    base = min(100, request.phrase_count * 12 + request.distinct_pictograms * 8)
    penalty = min(25, request.repeated_pictograms * 4 + request.correction_count * 2)
    duration_bonus = 8 if 60 <= request.session_duration <= 900 else 0
    score = max(0, min(100, base + duration_bonus - penalty))

    return {
        "global_score": score,
        "score_breakdown": {
            "phrases": request.phrase_count,
            "distinct_pictograms": request.distinct_pictograms,
            "repetitions": request.repeated_pictograms,
            "duration_bonus": duration_bonus,
        },
        "interpretation": "Bonne progression" if score >= 70 else "Progression a renforcer par des routines courtes",
        "next_step": "Reprendre les pictogrammes connus puis ajouter une nouveaute contextualisee.",
        "confidence": 0.7,
        "caution_note": "",
    }


@app.post("/ai/adapt-level")
def adapt_level(request: AdaptLevelRequest) -> dict[str, Any]:
    should_increase = (
        request.average_score >= 75
        and request.progression_trend >= 0
        and request.consistency_index >= 0.6
        and request.usage_regularity >= 0.5
    )
    suggested = "Niveau 2" if should_increase else request.current_level

    return {
        "suggested_level": suggested,
        "should_change": should_increase,
        "reason": "Score stable et usage regulier." if should_increase else "Conserver le niveau actuel pour consolider les acquis.",
        "transition_recommendations": [
            "Introduire le nouveau niveau sur une activite familiere.",
            "Surveiller la fatigue et revenir au niveau precedent si necessaire.",
        ],
        "confidence": 0.69,
        "caution_note": "",
    }


@app.post("/stt")
async def speech_to_text(audio_file: UploadFile = File(...), language: str = Form("fr")) -> dict[str, str]:
    try:
        from api_stt.api import transcrire_audio
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Module STT indisponible. Installez les dependances avec: pip install -r requirements.txt. Detail: {error}",
        ) from error

    suffix = Path(audio_file.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(audio_file.file, temp_file)
        temp_path = temp_file.name

    try:
        return {"texte": transcrire_audio(temp_path, language=language), "language": language}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        Path(temp_path).unlink(missing_ok=True)
