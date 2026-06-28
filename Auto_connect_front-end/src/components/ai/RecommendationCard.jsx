import { Sparkles } from "lucide-react";
import Card from "../common/Card";

function RecommendationCard({ text }) {
  return (
    <Card icon={Sparkles} title="Recommandation IA">
      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </Card>
  );
}

export default RecommendationCard;
