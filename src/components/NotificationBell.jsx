import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { notificationService } from "../services/notificationService";
import { formatDateTimeIST } from "../utils/dateTime.js";

// Poll interval for unread count — a full push/websocket setup is
// overkill for this app's scale; a cheap poll keeps the bell honest
// without adding new infra. Only polls while the tab is visible.
const POLL_MS = 30000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const refreshCount = () => {
    notificationService
      .list(true)
      .then((res) => setUnreadCount(res.unread_count))
      .catch(() => {});
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openPanel = () => {
    setOpen((prev) => !prev);
    if (!loaded) {
      setLoading(true);
      notificationService
        .list(false)
        .then((res) => {
          setItems(res.items);
          setUnreadCount(res.unread_count);
          setLoaded(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationService.markRead(n.id).catch(() => {});
    }
    setOpen(false);
    if (n.link_path) navigate(n.link_path);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      // best-effort — a stale unread count self-corrects on next poll
    }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={openPanel}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">Loading...</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50 ${
                    n.is_read ? "" : "bg-primary-50/40"
                  }`}
                >
                  <div className="flex w-full items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />}
                    <span className={`text-xs ${n.is_read ? "text-slate-500" : "text-slate-700"}`}>{n.message}</span>
                  </div>
                  <span className="pl-3.5 text-[11px] text-slate-400">{formatDateTimeIST(n.created_at)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
