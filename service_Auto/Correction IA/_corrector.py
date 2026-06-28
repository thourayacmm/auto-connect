import ollama

SYSTEM_PROMPT = """
Tu es un correcteur orthographique et grammatical français expert.

Corriger n'importe quel mot, groupe de mots ou phrase en français.

Règles strictes :
- Corrige les fautes d'orthographe.
- Corrige les accents manquants.
- Corrige les erreurs phonétiques.
- Corrige les lettres manquantes, inversées ou répétées.
- Corrige la grammaire, la conjugaison et la ponctuation.
- Conserve le sens original.
- Ne reformule pas inutilement.
- Ne donne aucune explication.
- Ne retourne que le texte corrigé.
- Réponds avec une seule ligne contenant uniquement le texte corrigé.
"""

MODEL = "llama3.1:8b"
FALLBACK_MODEL = "mistral"
# If the main model is not installed: ollama pull llama3.1:8b


def correct_text(text: str) -> str:
    text = text.strip()

    if not text:
        return ""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": text},
    ]

    try:
        response = ollama.chat(
            model=MODEL,
            messages=messages,
            options={
                "temperature": 0,
            },
        )
    except ollama.ResponseError as error:
        if "not found" not in str(error).lower():
            raise
        response = ollama.chat(
            model=FALLBACK_MODEL,
            messages=messages,
            options={
                "temperature": 0,
            },
        )

    corrected = response["message"]["content"].strip()
    corrected = corrected.replace("Correction :", "").strip()
    corrected = corrected.replace("Texte corrigé :", "").strip()
    corrected = corrected.strip('"').strip("'")

    return corrected


if __name__ == "__main__":
    text = "bonjour je suis tres contant de te voir aujourd hui"
    print(correct_text(text))

