function ProgressChart({ data, color = "bg-slateBlue", unit = "%" }) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{item.label}</span>
            <span className="text-slate-500">
              {item.value}
              {unit}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className={`h-3 rounded-full ${color}`} style={{ width: `${item.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProgressChart;
