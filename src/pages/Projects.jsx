import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Projects() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Organize your work by product or team"
        actions={<Button icon={Plus}>New Project</Button>}
      />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects..."
        className="mb-5 max-w-sm"
      />

      <EmptyState
        icon={FolderKanban}
        title="Coming soon"
        description="Project creation and management is on the roadmap. Once available, you'll be able to create projects, invite teammates, and track bugs by product here."
      />
    </div>
  );
}
