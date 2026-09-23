import { useEffect, useMemo, useRef, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../api/auth.js";
import { getProjects } from "../api/projects.js";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "../api/tasks.js";
import { getUsers } from "../api/users.js";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import {
  formatDateTimeIST,
  istDateTimeLocalToUTCISOString,
  toISTDateTimeLocal,
} from "../utils/datetime.js";

const statuses = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const statusStyles = {
  todo: "border-slate-200 bg-slate-50 text-slate-700",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const emptyForm = {
  project: "",
  title: "",
  description: "",
  status: "todo",
  assignee: "",
  due_date: "",
};

function listFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function paginationFromResponse(data) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
    };
  }

  return {
    count: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function userLabel(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name ? `${name} (${user.email})` : user.email;
}

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

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
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

function EyeIcon() {
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
        d="M2.75 12s3.5-6.25 9.25-6.25S21.25 12 21.25 12 17.75 18.25 12 18.25 2.75 12 2.75 12Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" />
    </svg>
  );
}

function PencilIcon() {
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
        d="m16.9 4.7 2.4 2.4M5 19l4.6-1 9.1-9.1a1.7 1.7 0 0 0 0-2.4l-1.2-1.2a1.7 1.7 0 0 0-2.4 0L6 14.4 5 19Z"
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

function ToastIcon({ type }) {
  if (type === "error") {
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

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  );
}

function TasksToast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  const isError = toast.type === "error";

  return (
    <div className="fixed right-4 top-24 z-50 w-[calc(100%-2rem)] max-w-sm sm:right-6">
      <div
        className={`toast-card flex items-start gap-3 rounded-lg border bg-white p-4 shadow-2xl shadow-slate-900/12 ${
          isError ? "border-red-200" : "border-emerald-200"
        }`}
        role="status"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <ToastIcon type={toast.type} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">
            {isError ? "Action failed" : "Action complete"}
          </p>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="Dismiss notification"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="modal-card w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-sky-700 text-white shadow-lg shadow-slate-900/15">
              <ClipboardIcon />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {task?.title || `Task #${taskId}`}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Direct task link details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
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

        {isLoading ? (
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
              <ToastIcon type="error" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">Could not load this task</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Please refresh or check whether you still have access to this task.
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-6">
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

function TaskTitle({ task, onOpen }) {
  const [tooltipPosition, setTooltipPosition] = useState(null);

  function showTooltip(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 280;
    const horizontalPadding = 16;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, tooltipWidth / 2 + horizontalPadding),
      window.innerWidth - tooltipWidth / 2 - horizontalPadding,
    );

    setTooltipPosition({
      top: rect.bottom + 10,
      left,
    });
  }

  return (
    <div className="flex min-w-72 items-center gap-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-slate-800 to-sky-700 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
        aria-label={`Open details for ${task.title}`}
      >
        {getTaskInitials(task)}
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="truncate text-left font-bold text-slate-950 transition hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {task.title}
          </button>
          {task.description && (
            <>
              <button
                type="button"
                aria-label="Task description"
                onMouseEnter={showTooltip}
                onMouseLeave={() => setTooltipPosition(null)}
                onFocus={showTooltip}
                onBlur={() => setTooltipPosition(null)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                i
              </button>
              {tooltipPosition && (
                <div
                  className="pointer-events-none fixed z-50 max-w-[280px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-white shadow-xl"
                  style={{
                    left: tooltipPosition.left,
                    top: tooltipPosition.top,
                    transform: "translateX(-50%)",
                  }}
                >
                  {task.description}
                </div>
              )}
            </>
          )}
        </div>
        {/* <p className="mt-0.5 text-xs font-medium text-slate-500">Task ID #{task.id}</p> */}
      </div>
    </div>
  );
}

function Tasks() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const canManageTasks = currentUser?.role === "admin" || currentUser?.role === "manager";
  const [selectedTaskId, setSelectedTaskId] = useQueryState("task", parseAsInteger);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    assignee: "",
    due_date_from: "",
    due_date_to: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("assigned");
  const [toast, setToast] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskDetailState, setTaskDetailState] = useState("idle");
  const [isTaskDetailLoading, setIsTaskDetailLoading] = useState(false);
  const referenceDataLoadedRef = useRef(false);
  const referenceDataRequestRef = useRef(null);
  const referenceDataControllerRef = useRef(null);

  const isModalOpen = Boolean(modalMode);
  const isTaskDetailOpen = selectedTaskId !== null;
  const modalTitle = modalMode === "edit" ? "Edit Task" : "Create Task";
  const visibleTabs = canManageTasks
    ? [
        { id: "assigned", label: "Assigned To Me" },
        { id: "created", label: "Created By Me" },
      ]
    : [{ id: "assigned", label: "Assigned To Me" }];
  const showAssigneeColumn = activeTab === "created";
  const showAssignedByColumn = activeTab === "assigned";
  const showAssigneeFilter = canManageTasks && activeTab === "created";
  const displayedTasks = useMemo(() => tasks, [tasks]);
  const totalPages = Math.max(1, Math.ceil(pagination.count / pageSize));
  const firstVisibleTask = pagination.count === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleTask = Math.min(page * pageSize, pagination.count);
  const activeFiltersCount = [
    filters.status,
    filters.assignee,
    filters.due_date_from,
    filters.due_date_to,
  ].filter(Boolean).length;

  function handleAuthError(apiError) {
    if (apiError?.status === 401) {
      logout(navigate);
      return true;
    }

    return false;
  }

  function getTaskFilters() {
    const params = {
      page,
      page_size: pageSize,
    };

    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.due_date_from) {
      params.due_date_from = filters.due_date_from;
    }
    if (filters.due_date_to) {
      params.due_date_to = filters.due_date_to;
    }
    if (activeTab === "assigned" && currentUser?.id) {
      params.assignee = currentUser.id;
    } else if (filters.assignee) {
      params.assignee = filters.assignee;
    }

    return params;
  }

  async function loadTaskList({ signal } = {}) {
    setIsLoading(true);
    setError("");

    try {
      const taskData = await getTasks(getTaskFilters(), { signal });

      if (signal?.aborted) {
        return;
      }

      setTasks(listFromResponse(taskData));
      setPagination(paginationFromResponse(taskData));
    } catch (apiError) {
      if (isAbortError(apiError)) {
        return;
      }

      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not load tasks.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }

  async function loadTaskReferenceData({ signal } = {}) {
    try {
      const [projectData, userData] = await Promise.all([
        getProjects({ signal }),
        getUsers({ signal }),
      ]);

      if (signal?.aborted) {
        return;
      }

      const nextProjects = listFromResponse(projectData);
      const nextUsers = listFromResponse(userData);

      setProjects(nextProjects);
      setUsers(nextUsers);

      return {
        projects: nextProjects,
        users: nextUsers,
      };
    } catch (apiError) {
      if (isAbortError(apiError)) {
        return null;
      }

      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not load task reference data.";
        setError(message);
        setToast({ type: "error", message });
      }

      throw apiError;
    }

    return null;
  }

  async function ensureTaskReferenceData() {
    if (!canManageTasks || referenceDataLoadedRef.current) {
      return {
        projects,
        users,
      };
    }

    if (!referenceDataRequestRef.current) {
      referenceDataControllerRef.current = new AbortController();
      referenceDataRequestRef.current = loadTaskReferenceData({
        signal: referenceDataControllerRef.current.signal,
      })
        .then((data) => {
          if (data) {
            referenceDataLoadedRef.current = true;
          }

          return data;
        })
        .finally(() => {
          referenceDataRequestRef.current = null;
          referenceDataControllerRef.current = null;
        });
    }

    return referenceDataRequestRef.current;
  }

  useEffect(() => {
    const controller = new AbortController();

    loadTaskList({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [
    activeTab,
    filters.status,
    filters.assignee,
    filters.due_date_from,
    filters.due_date_to,
    page,
    pageSize,
  ]);

  useEffect(() => {
    if (!canManageTasks) {
      setActiveTab("assigned");
    }
  }, [canManageTasks]);

  useEffect(() => {
    return () => {
      referenceDataControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (selectedTaskId === null) {
      setTaskDetail(null);
      setTaskDetailState("idle");
      setIsTaskDetailLoading(false);
      return undefined;
    }

    let ignore = false;
    setTaskDetail(null);
    setTaskDetailState("idle");
    setIsTaskDetailLoading(true);

    const controller = new AbortController();

    getTask(selectedTaskId, { signal: controller.signal })
      .then((data) => {
        if (ignore) {
          return;
        }

        if (!data?.id) {
          setTaskDetailState("deleted");
          return;
        }

        setTaskDetail(data);
        setTaskDetailState("ready");
      })
      .catch((apiError) => {
        if (isAbortError(apiError)) {
          return;
        }

        if (ignore || handleAuthError(apiError)) {
          return;
        }

        setTaskDetailState(apiError?.status === 404 ? "deleted" : "error");
      })
      .finally(() => {
        if (!ignore) {
          setIsTaskDetailLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedTaskId]);

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setPage(1);
    if (tabId === "assigned") {
      setFilters((current) => ({ ...current, assignee: "" }));
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      status: "",
      assignee: "",
      due_date_from: "",
      due_date_to: "",
    });
    setPage(1);
  }

  function handlePageSizeChange(value) {
    setPageSize(Number(value));
    setPage(1);
  }

  async function openCreateModal() {
    setSelectedTaskId(null);
    setError("");
    setToast(null);

    let referenceData = {
      projects,
      users,
    };

    try {
      referenceData = (await ensureTaskReferenceData()) || referenceData;
    } catch {
      return;
    }

    setModalMode("create");
    setSelectedTask(null);
    setFormValues({
      ...emptyForm,
      project: referenceData.projects[0]?.id ? String(referenceData.projects[0].id) : "",
    });
  }

  async function openEditModal(task) {
    setSelectedTaskId(null);
    setError("");
    setToast(null);

    try {
      await ensureTaskReferenceData();
    } catch {
      return;
    }

    setModalMode("edit");
    setSelectedTask(task);
    setFormValues({
      project: task.project ? String(task.project) : "",
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "todo",
      assignee: task.assignee ? String(task.assignee) : "",
      due_date: toISTDateTimeLocal(task.due_date),
    });
  }

  function closeModal({ force = false } = {}) {
    if (isSaving && !force) {
      return;
    }

    setModalMode(null);
    setSelectedTask(null);
    setFormValues(emptyForm);
  }

  function openTaskDetail(task) {
    setSelectedTaskId(task.id);
  }

  function closeTaskDetail() {
    setSelectedTaskId(null);
  }

  function updateFormValue(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!formValues.project) {
      return "Project is required.";
    }
    if (!formValues.title.trim()) {
      return "Title is required.";
    }
    return "";
  }

  function buildTaskPayload() {
    return {
      project: Number(formValues.project),
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      status: formValues.status,
      assignee: formValues.assignee ? Number(formValues.assignee) : null,
      due_date: istDateTimeLocalToUTCISOString(formValues.due_date),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (modalMode === "edit" && selectedTask) {
        await updateTask(selectedTask.id, buildTaskPayload());
        setToast({ type: "success", message: "Task updated successfully." });
      } else {
        await createTask(buildTaskPayload());
        setToast({ type: "success", message: "Task created successfully." });
      }

      closeModal({ force: true });
      await loadTaskList();
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not save task.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(task, status) {
    setError("");

    try {
      await updateTask(task.id, { status });
      await loadTaskList();
      setToast({ type: "success", message: "Task status updated successfully." });
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not update task status.";
        setError(message);
        setToast({ type: "error", message });
      }
    }
  }

  function openDeleteModal(task) {
    setTaskToDelete(task);
    setError("");
    setToast(null);
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteTask(taskToDelete.id);
      setToast({ type: "success", message: "Task deleted successfully." });
      setTaskToDelete(null);
      if (tasks.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadTaskList();
      }
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not delete task.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <TasksToast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-950">
            Tasks
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {canManageTasks
              ? "Plan, assign, and monitor project tasks."
              : "Track and update your assigned work."}
          </p>
        </div>

        {canManageTasks && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-900/20 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <PlusIcon />
            Create Task
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/[0.04]">
        <div className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Task Board</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Showing {firstVisibleTask}-{lastVisibleTask} of {pagination.count} tasks
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-flex min-w-max rounded-lg border border-slate-200 bg-slate-50 p-1">
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                        isActive
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/50 p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-700"
                htmlFor="task-status-filter"
              >
                Status
              </label>
              <select
                id="task-status-filter"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {showAssigneeFilter && (
              <div>
                <label
                  className="mb-2 block text-sm font-bold text-slate-700"
                  htmlFor="task-assignee-filter"
                >
                  Assignee
                </label>
                <select
                  id="task-assignee-filter"
                  value={filters.assignee}
                  onChange={(event) => updateFilter("assignee", event.target.value)}
                  className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">All Assignees</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userLabel(user)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-700"
                htmlFor="task-due-from"
              >
                Due From
              </label>
              <input
                id="task-due-from"
                type="date"
                value={filters.due_date_from}
                onChange={(event) => updateFilter("due_date_from", event.target.value)}
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-700"
                htmlFor="task-due-to"
              >
                Due To
              </label>
              <input
                id="task-due-to"
                type="date"
                value={filters.due_date_to}
                onChange={(event) => updateFilter("due_date_to", event.target.value)}
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-700"
                htmlFor="task-page-size"
              >
                Page Size
              </label>
              <select
                id="task-page-size"
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {activeFiltersCount} active {activeFiltersCount === 1 ? "filter" : "filters"}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <ClipboardIcon />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-950">No tasks found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Adjust filters or create a task to start tracking work here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Project</th>
                  {showAssigneeColumn && <th className="px-5 py-4">Assigned To</th>}
                  {showAssignedByColumn && <th className="px-5 py-4">Assigned By</th>}
                  <th className="px-5 py-4">Due</th>
                  <th className="px-5 py-4">Status</th>
                  {canManageTasks && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTasks.map((task) => (
                  <tr key={task.id} className="group align-middle transition hover:bg-sky-50/35">
                    <td className="px-5 py-4">
                      <TaskTitle task={task} onOpen={() => openTaskDetail(task)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="max-w-52 truncate font-medium">
                          {task.project_name || `Project #${task.project}`}
                        </span>
                      </div>
                    </td>
                    {showAssigneeColumn && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">                          
                          <span className="max-w-52 truncate font-medium">
                            {task.assignee_name || task.assignee_email || "Unassigned"}
                          </span>
                        </div>
                      </td>
                    )}
                    {showAssignedByColumn && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="max-w-52 truncate font-medium">
                            {task.assigned_by_name || task.assigned_by_email || "-"}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-medium">{formatDateTimeIST(task.due_date)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={task.status}
                        onChange={(event) => handleStatusChange(task, event.target.value)}
                        className={`h-9 rounded-lg border px-2.5 text-sm font-bold outline-none transition focus:ring-4 focus:ring-sky-100 ${
                          statusStyles[task.status] || "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {canManageTasks && (
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openTaskDetail(task)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          >
                            <EyeIcon />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          >
                            <PencilIcon />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(task)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-medium">
          Showing {firstVisibleTask}-{lastVisibleTask} of {pagination.count} tasks
        </div>
        <div className="inline-flex self-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.previous || page <= 1 || isLoading}
            className="px-3 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
          >
            Previous
          </button>
          <span className="border-x border-slate-200 px-3 py-2 font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!pagination.next || isLoading}
            className="px-3 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="modal-card max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-sky-700 text-white shadow-lg shadow-slate-900/15">
                  <ClipboardIcon />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{modalTitle}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {modalMode === "edit"
                      ? "Update task ownership, status, and timing."
                      : "Create a task and route it to the right teammate."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close task modal"
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

            <form className="max-h-[calc(100vh-9rem)] space-y-5 overflow-y-auto p-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5">
                    <ToastIcon type="error" />
                  </span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="project">
                    Project
                  </label>
                  <select
                    id="project"
                    value={formValues.project}
                    onChange={(event) => updateFormValue("project", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formValues.status}
                    onChange={(event) => updateFormValue("status", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="title">
                  Title
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <ClipboardIcon />
                  </span>
                  <input
                    id="title"
                    type="text"
                    value={formValues.title}
                    onChange={(event) => updateFormValue("title", event.target.value)}
                    placeholder="Example: Prepare launch checklist"
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-0 pl-10 pr-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-bold text-slate-700"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows="3"
                  value={formValues.description}
                  onChange={(event) => updateFormValue("description", event.target.value)}
                  placeholder="Add context, handoff notes, or acceptance criteria."
                  className="block min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="assignee"
                  >
                    Assignee
                  </label>
                  <select
                    id="assignee"
                    value={formValues.assignee}
                    onChange={(event) => updateFormValue("assignee", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {userLabel(user)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="due_date"
                  >
                    Due Date
                  </label>
                  <input
                    id="due_date"
                    type="datetime-local"
                    value={formValues.due_date}
                    onChange={(event) => updateFormValue("due_date", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Save Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {taskToDelete && (
        <DeleteConfirmationModal
          title="Delete Task"
          description={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setTaskToDelete(null);
            }
          }}
          onDelete={confirmDeleteTask}
        />
      )}
    </div>
  );
}

export default Tasks;
