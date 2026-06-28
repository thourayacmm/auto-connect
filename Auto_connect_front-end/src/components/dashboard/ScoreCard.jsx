import Card from "../common/Card";
import ProgressChart from "./ProgressChart";

function ScoreCard({ scores }) {
  return (
    <Card title="Scores IA">
      <ProgressChart data={scores} color="bg-aqua" unit="/100" />
    </Card>
  );
}

export default ScoreCard;
