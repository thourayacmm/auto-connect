import Card from "../common/Card";

function ActivityCard({ title, subtitle, meta }) {
  return (
    <Card className="h-full">
      <p className="font-semibold text-themed-primary">{title}</p>
      <p className="mt-2 text-sm text-themed-muted">{subtitle}</p>
      {meta ? (
        <p className="mt-4 text-xs font-semibold text-slateBlue dark:text-sky-400">{meta}</p>
      ) : null}
    </Card>
  );
}

export default ActivityCard;
