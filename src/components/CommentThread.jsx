import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Send } from "lucide-react";
import { commentService } from "../services/commentService";
import { useAuth } from "../hooks/useAuth";
import { hasPermission } from "../utils/rbac.js";
import { formatDateTimeIST } from "../utils/dateTime.js";
import Avatar from "./Avatar.jsx";
import Loader from "./Loader.jsx";
import { getErrorMessage } from "../utils/apiError.js";

const MAX_LENGTH = 3000;

/**
 * Discussion thread on a Bug/Task/SubTask — the biggest functional gap
 * flagged against real-world trackers (no way to discuss an item
 * in-app at all). Drop this into any preview panel/page with the
 * entity's type + id; it's fully self-contained (loads its own
 * comments, posts, deletes).
 */
export default function CommentThread({ entityType, entityId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const canCreate = hasPermission(user, "comments.create");
  const canDeleteAny = hasPermission(user, "comments.delete_any");

  useEffect(() => {
    if (!entityType || !entityId) return;
    setLoading(true);
    commentService
      .list(entityType, entityId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  const handlePost = async () => {
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const created = await commentService.create(entityType, entityId, trimmed);
      setComments((prev) => [...prev, created]);
      setBody("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't post that comment."));
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (comment) => {
    setDeletingId(comment.id);
    try {
      await commentService.remove(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete that comment."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-slate-700">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h4>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader label="Loading comments..." />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400">No comments yet — be the first to add context here.</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((c) => {
            const canDeleteThis = canDeleteAny || c.author_id === user?.id;
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar name={c.author_name || "Deleted user"} size={26} />
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-slate-700">
                      {c.author_name || "Deleted user"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-slate-400">{formatDateTimeIST(c.created_at)}</span>
                      {canDeleteThis && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          title="Delete comment"
                          className="text-slate-300 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canCreate && (
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Add a comment..."
            rows={2}
            className="input flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePost();
              }
            }}
          />
          <button
            type="button"
            onClick={handlePost}
            disabled={!body.trim() || posting}
            title="Post comment (Cmd/Ctrl + Enter)"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
