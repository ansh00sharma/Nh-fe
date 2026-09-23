import { formatDateTimeIST } from "../utils/datetime.js";

const statusStyles = {
  todo: "border-slate-200 bg-slate-50 text-slate-700",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statuses = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

function statusLabel(value) {
  return statuses.find((status) => status.value === value)?.label || value || "-";
}

function getTaskInitials(task) {
  return (
    task.title
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TS"
  );
}

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5.5h6M9.5 4h5A1.5 1.5 0 0 1 16 5.5V7H8V5.5A1.5 1.5 0 0 1 9.5 4ZM6.5 6.5h11A1.5 1.5 0 0 1 19 8v10.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5V8a1.5 1.5 0 0 1 1.5-1.5ZM8.5 12h7M8.5 16h5"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v6A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-8Z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 19v-1.3a3.2 3.2 0 0 0-3.2-3.2H7.7a3.2 3.2 0 0 0-3.2 3.2V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM18.5 19v-1a3 3 0 0 0-2-2.8M16.5 5a3.4 3.4 0 0 1 0 6"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4v3M17 4v3M5 9h14M6.5 6h11A1.5 1.5 0 0 1 19 7.5v10A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-10A1.5 1.5 0 0 1 6.5 6Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4h6m-8 4h10m-9 0 .7 11A2 2 0 0 0 10.7 21h2.6a2 2 0 0 0 2-1.9L16 8M10 11v6M14 11v6"
      />
    </svg>
  );
}

function ToastIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v5m0 3h.01M10.3 4.5 3.6 16A2 2 0 0 0 5.3 19h13.4a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z"
      />
    </svg>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value || "-"}</p>
    </div>
  );
}

function TaskDetailModal({ task, taskId, isLoading, state, onClose }) {
  const isDeleted = state === "deleted";
  const hasError = state === "error";
  const isWaitingForTask = isLoading || (!task && !isDeleted && !hasError);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="modal-card relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex justify-end px-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
            aria-label="Close task details"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {isWaitingForTask ? (
          <div className="grid gap-3 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : isDeleted ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrashIcon />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">This task was deleted</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              The task link is valid, but the backend did not return an active task record.
            </p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ToastIcon />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">Could not load this task</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Please refresh or check whether you still have access to this task.
            </p>
          </div>
        ) : (
          <div className="space-y-5 px-6 pb-6 pt-2">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 via-slate-800 to-sky-700 text-sm font-bold text-white shadow-md shadow-slate-900/10">
                  {getTaskInitials(task)}
                </span>
                <div>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{task.title}</h3>
                </div>
              </div>
              <span
                className={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-bold sm:self-center ${
                  statusStyles[task.status] || "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {statusLabel(task.status)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={<FolderIcon />}
                label="Project"
                value={task.project_name || `Project #${task.project}`}
              />
              <DetailItem
                icon={<UserIcon />}
                label="Assignee"
                value={task.assignee_name || task.assignee_email || "Unassigned"}
              />
              <DetailItem
                icon={<UserIcon />}
                label="Assigned By"
                value={task.assigned_by_name || task.assigned_by_email || "-"}
              />
              <DetailItem
                icon={<CalendarIcon />}
                label="Due"
                value={formatDateTimeIST(task.due_date)}
              />
              <DetailItem
                icon={<CalendarIcon />}
                label="Created"
                value={formatDateTimeIST(task.created_at)}
              />
              <DetailItem
                icon={<CalendarIcon />}
                label="Updated"
                value={formatDateTimeIST(task.updated_at)}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <ClipboardIcon />
                Description
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                {task.description || "No description was added for this task."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default TaskDetailModal;
