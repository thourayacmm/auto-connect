import { useMemo, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

export function TrendLineChart({
  weeklyData,
  monthlyData,
  valueSuffix = "%",
  lineLabelWeek = "Performance semaine",
  lineLabelMonth = "Performance mois",
  yTickFormatter = (value) => `${value}${valueSuffix}`,
  tooltipFormatter = (value) => `${value}${valueSuffix}`,
  maxY,
}) {
  const [period, setPeriod] = useState("week");
  const trendData = period === "week" ? weeklyData : monthlyData;
  const computedMaxY = useMemo(() => {
    if (typeof maxY === "number") return maxY;
    const values = [...weeklyData, ...monthlyData].map((item) => Number(item?.value || 0));
    const maxValue = Math.max(0, ...values);
    if (!maxValue) return valueSuffix === "%" ? 100 : 5;
    return valueSuffix === "%" ? Math.max(100, Math.ceil(maxValue / 10) * 10) : Math.ceil(maxValue * 1.2);
  }, [maxY, monthlyData, valueSuffix, weeklyData]);

  const lineData = useMemo(
    () => ({
      labels: trendData.map((item) => item.label),
      datasets: [
        {
          label: period === "week" ? lineLabelWeek : lineLabelMonth,
          data: trendData.map((item) => item.value),
          borderColor: "#5c75e6",
          backgroundColor: "rgba(92, 117, 230, 0.16)",
          borderWidth: 3,
          fill: true,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#5c75e6",
          pointBorderWidth: 3,
          pointRadius: 4,
          tension: 0.4,
        },
      ],
    }),
    [lineLabelMonth, lineLabelWeek, period, trendData],
  );

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => tooltipFormatter(context.parsed.y),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#536179", font: { weight: 600 } },
      },
      y: {
        beginAtZero: true,
        max: computedMaxY,
        grid: { color: "rgba(83, 97, 121, 0.12)" },
        ticks: {
          color: "#536179",
          callback: (value) => yTickFormatter(value),
        },
      },
    },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          {period === "week" ? "Vue par semaine" : "Vue par mois"}
        </p>
        <div className="flex rounded-2xl bg-slate-100 p-1">
          {[
            { id: "week", label: "Semaine" },
            { id: "month", label: "Mois" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                period === item.id ? "bg-white text-slateBlue shadow-sm" : "text-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
}

export function CategoryDoughnutChart({ analysisData }) {
  const doughnutData = useMemo(
    () => ({
      labels: analysisData.map((item) => item.label),
      datasets: [
        {
          data: analysisData.map((item) => item.value),
          backgroundColor: ["#5c75e6", "#72c6f4", "#9f92f4", "#68d6c7"],
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 6,
        },
      ],
    }),
    [analysisData],
  );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#536179",
          padding: 14,
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Doughnut data={doughnutData} options={doughnutOptions} />
    </div>
  );
}
