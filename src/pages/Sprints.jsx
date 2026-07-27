import { Plus, Rocket } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Sprints() {
  return (
    <div>
      <PageHeader
        title="Sprints"
        subtitle="Plan, run, and review sprint cycles"
        actions={<Button icon={Plus}>New Sprint</Button>}
      />
      <EmptyState
        icon={Rocket}
        title="Sprint management coming soon"
        description="Create sprints, assign tasks and bugs, and track burndown once this module is built out."
      />
    </div>
  );
}
