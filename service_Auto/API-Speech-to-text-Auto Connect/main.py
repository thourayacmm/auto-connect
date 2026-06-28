from vosk import Model, KaldiRecognizer
import pyaudio
import json

# Charger le modèle
#model_en = Model("models/vosk-model-en-us-0.42-gigaspeech")#slow - not too accurate - ranking_en:3
#model_en = Model("models/vosk-model-small-en-us-0.15")#fast- accurate - ranking_en:2
model_en = Model("models/vosk-model-en-us-0.22-lgraph") # fast more accurate than 0.15 - ranking_en:1

# model_fr = Model("models/vosk-model-small-fr-0.22")# fast - ranking_fr:2
model_fr = Model("models/vosk-model-fr-0.22") # fast- recognizes most words - mostly accurate - ranking_fr:1

# Choix de langue
lang = "en"

if lang == "fr":
    model = model_fr
    print("🇫🇷 Mode français activé")
else:
    model = model_en
    print("🇺🇸 Mode anglais activé")
    
# Configurer le micro
recognizer = KaldiRecognizer(model, 16000)
p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000,
            input=True, frames_per_buffer=8000)
stream.start_stream()

print(":microphone: Parlez dans le micro... (Ctrl+C pour arrêter)")

try:
    while True:
        data = stream.read(4000, exception_on_overflow=False)
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            print(":speaking_head_in_silhouette: Vous avez dit :", result.get("text", ""))
except KeyboardInterrupt:
    print("\n:black_square_for_stop: Arrêté par l'utilisateur")
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()