import { useEffect, useState } from "react";
import ChatbotPanel from "../../components/ai/ChatbotPanel";
import { getKidHistoryApi, getKidProgressApi, listKidsApi } from "../../services/domainApi";

function AIChat() {
  const [chatContext, setChatContext] = useState({
    initialMessages: [],
    history: [],
    profile: {},
  });

  useEffect(() => {
    listKidsApi()
      .then(async (kids) => {
        const firstKid = kids[0];
        if (!firstKid) return;

        const [progress, history] = await Promise.all([
          getKidProgressApi(firstKid.id).catch(() => null),
          getKidHistoryApi(firstKid.id).catch(() => []),
        ]);

        setChatContext({
          initialMessages: [
            {
              id: 1,
              sender: "ai",
              text: `Je suis pret a t'aider pour ${firstKid.name}. Pose-moi une question sur sa communication, ses scenarios ou ses progres.`,
            },
          ],
          history: history.slice(0, 6).map((item) => ({
            label: item.correctedText || item.generatedText || "Phrase",
            category: item.source || "manual",
            score: typeof item.score === "number" && item.score > 0 ? item.score : null,
          })),
          profile: {
            kidId: firstKid.id,
            name: firstKid.name,
            age: firstKid.age,
            currentLevel: progress?.currentLevel || firstKid.level,
            objectives: (progress?.assignedScenarios || []).slice(0, 3).map((item) => item.title),
            latestScores: (progress?.scoreEvolution || []).slice(0, 5).map((item) => item.value),
            previousRecommendations: (progress?.recentRecommendations || [])
              .slice(0, 4)
              .map((item) => item.content || item.title)
              .filter(Boolean),
          },
        });
      })
      .catch(() => {});
  }, []);

  return (
    <ChatbotPanel
      initialMessages={chatContext.initialMessages}
      history={chatContext.history}
      profile={chatContext.profile}
      role="parent"
    />
  );
}

export default AIChat;
