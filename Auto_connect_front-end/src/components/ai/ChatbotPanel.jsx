import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Lightbulb, Send, Sparkles, UserRound } from "lucide-react";
import Button from "../common/Button";
import { askAssistant, generateRecommendations } from "../../services/aiApi";

const defaultReply =
  "Essayez de renforcer les pictogrammes lies aux besoins quotidiens, puis ajoutez un seul nouveau mot a la fois.";

const quickPrompts = [
  "Comment motiver mon enfant aujourd'hui ?",
  "Quels pictogrammes travailler cette semaine ?",
  "Que faire s'il refuse l'exercice ?",
];

function ChatbotPanel({ initialMessages = [], history = [], profile = {}, role = "parent" }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    generateRecommendations({
      history,
      profile,
    })
      .then((result) => {
        const nextRecommendations = [
          ...(result.recommended_pictograms || []).map((item) => item.reason),
          ...(result.adaptation_suggestions || []),
          ...(result.supervisor_tips || []),
        ].filter(Boolean);

        if (nextRecommendations.length) {
          setAiRecommendations(nextRecommendations.slice(0, 3));
        }
      })
      .catch(() => {
        setAiRecommendations([]);
      });
  }, [history, profile]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setMessages((current) => [...current, { id: Date.now(), sender: "parent", text }]);
    setDraft("");
    setIsSending(true);
    setConnectionError("");

    try {
      const result = await askAssistant({ query: text, role, context: profile });
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, sender: "ai", text: result.answer || defaultReply },
      ]);

      if (result.recommendations?.length) {
        setAiRecommendations(result.recommendations.slice(0, 3));
      }
    } catch (_error) {
      setConnectionError("Le backend IA n'est pas joignable. Verifie que le backend Express et le service IA FastAPI tournent.");
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Je n'arrive pas a joindre le service IA pour le moment. Je garde une reponse locale temporaire.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="grid h-[calc(100vh-6.5rem)] min-h-[620px] gap-6 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="section-shell flex min-h-0 flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-softBlue/10 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
              <Bot className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Assistant IA</h2>
              <p className="text-sm text-slate-500">
                Conseils rapides pour accompagner la communication a la maison.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5 pb-7">
          {messages.map((message) => {
            const isAi = message.sender === "ai";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isAi ? "justify-start" : "justify-end"}`}
              >
                {isAi ? (
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                    <Bot className="h-4 w-4" />
                  </span>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
                    isAi
                      ? "bg-white text-slate-700"
                      : "bg-gradient-to-r from-softBlue to-slateBlue text-white"
                  }`}
                >
                  {message.text}
                </div>
                {!isAi ? (
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-lilac/25 text-slateBlue">
                    <UserRound className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            );
          })}
          {isSending ? (
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-softBlue/15 text-slateBlue">
                <Bot className="h-4 w-4" />
              </span>
              <span className="rounded-[24px] bg-white px-4 py-3 shadow-sm">Analyse du contexte backend...</span>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-softBlue/10 bg-white p-5">
          {connectionError ? (
            <div className="mb-3 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {connectionError}
            </div>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="focus-ring rounded-2xl bg-softBlue/10 px-4 py-2 text-xs font-semibold text-slateBlue transition hover:bg-softBlue/20"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form className="flex items-center gap-3" onSubmit={handleSubmit}>
            <input
              id="chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ecrire un message..."
              disabled={isSending}
              className="focus-ring min-h-12 flex-1 rounded-2xl border border-softBlue/20 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400"
            />
            <Button type="submit" disabled={isSending} aria-label="Envoyer le message" className="h-12 w-12 px-0">
              {isSending ? <Sparkles className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <div className="section-shell p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slateBlue" />
            <h3 className="font-display text-lg font-bold text-ink">Suggestions</h3>
          </div>
          <div className="space-y-3">
            {aiRecommendations.length ? (
              aiRecommendations.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                Les suggestions apparaitront ici quand le backend IA retournera des recommandations.
              </div>
            )}
          </div>
        </div>

        <div className="section-shell p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#a85d18]" />
            <h3 className="font-display text-lg font-bold text-ink">Astuce</h3>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Pose une question courte et precise. L'assistant repond mieux quand tu cites le
            contexte, l'enfant et la situation.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default ChatbotPanel;
