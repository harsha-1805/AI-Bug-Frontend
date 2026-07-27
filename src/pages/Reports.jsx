import { BarChart3 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import ChartCard from "../components/ChartCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Deep analytics across bugs, sprints, and releases" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Bug Trend">
          <EmptyState icon={BarChart3} title="Analytics coming soon" description="Detailed trend reports will render here." />
        </ChartCard>
        <ChartCard title="Team Performance">
          <EmptyState icon={BarChart3} title="Analytics coming soon" description="Resolution time and workload breakdowns will render here." />
        </ChartCard>
      </div>
    </div>
  );
}
