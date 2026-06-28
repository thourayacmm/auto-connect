# corrector.py

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
import re 
# =============================
# Configuration API
# =============================

genai.configure(api_key="AIzaSyD83eAPc-9SFxkgU1dVCychuTn8D4H2EAY") #/ possibility of changing api-key from another account: AIzaSyAbrf3LC8Tl-esbiIEid7OC2HooKPKrdZ0
# but: modèle précis,  stable,  pas créatif
generation_config = GenerationConfig(
    temperature=0, # [0,1] creativity parameter
    top_p=0.8,#[0,1]
    max_output_tokens=100,# [50,256]
)
# =============================
# Charger le modèle Gemma
"""
gemma-4-31b-it
gemma-4-26b-a4b-it
gemma-4-e4b-it
gemma-4-e2b-it 
"""
# =============================

model = genai.GenerativeModel("gemma-4-26b-a4b-it")


def correct_text(text: str):

    prompt = f"""
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

Texte :
{text}
"""

   # response = model.generate_content(prompt)#
    response = model.generate_content(
        prompt,
        generation_config=generation_config
    )

    raw_output = response.text.strip()

    # === ALGORITHME DE FILTRAGE ===
    
    # Étape 1 : Si le modèle a renvoyé un bloc complet comme dans votre capture d'écran
    # On cherche s'il y a une ligne qui ressemble à une conclusion ou une option finale.
    lines = raw_output.split("\n")
    
    # Si le texte contient des puces d'explications (* Input, * Language...)
    if any(line.strip().startswith('*') for line in lines):
        # On extrait la toute dernière ligne non vide (votre choix final dans le raisonnement)
        final_lines = [l.strip() for l in lines if l.strip()]
        last_line = final_lines[-1]
        
        # On nettoie les préfixes potentiels comme "Corrected:", "Phrase corrigée:", "Final choice:"
        clean_text = re.sub(r'^(Corrected Text|Corrected|Final choice|Phrase corrigée)\s*:\s*', '', last_line, flags=re.IGNORECASE)
        # On enlève les puces '*' ou les guillemets si le modèle en a mis autour de la phrase
        return clean_text.strip("* ").strip('"').strip("'")

    # Étape 2 : Si le modèle a juste écrit "Phrase corrigée : [La Phrase]"
    clean_output = re.sub(r'^(Phrase corrigée|Corrected sentence)\s*:\s*', '', raw_output, flags=re.IGNORECASE)
    
    return clean_output.strip('"').strip("'")




# Test local
if __name__ == "__main__":

    text = "bonjour je suis tres contant de te voir aujourd hui"

    print(correct_text(text))
