import PageHeader from "../components/PageHeader.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Avatar from "../components/Avatar.jsx";
import Badge from "../components/Badge.jsx";
import { useAuth } from "../hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and workspace preferences" />

      <div className="card max-w-2xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user?.full_name || "User"} size={56} />
          <div>
            <p className="text-sm font-semibold text-slate-800">{user?.full_name || "—"}</p>
            <p className="text-xs text-slate-400">{user?.email || "—"}</p>
            {user?.role?.name && (
              <div className="mt-1.5">
                <Badge tone="info">{user.role.name}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" defaultValue={user?.full_name || ""} disabled />
          <Input label="Email address" defaultValue={user?.email || ""} disabled />
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Editing your profile and other workspace settings will be enabled in a future update.
        </p>

        <div className="mt-6">
          <Button variant="secondary" disabled>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
