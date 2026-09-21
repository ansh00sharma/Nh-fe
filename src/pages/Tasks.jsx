import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../api/auth.js";
import { getProjects } from "../api/projects.js";
import { createTask, deleteTask, getTasks, updateTask } from "../api/tasks.js";
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

function userLabel(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name ? `${name} (${user.email})` : user.email;
}

function TaskTitle({ task }) {
  const [tooltipPosition, setTooltipPosition] = useState(null);

  function showTooltip(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 260;
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
    <div className="flex items-center gap-2">
      <span className="font-medium text-slate-900">{task.title}</span>
      {task.description && (
        <>
          <button
            type="button"
            aria-label="Task description"
            onMouseEnter={showTooltip}
            onMouseLeave={() => setTooltipPosition(null)}
            onFocus={showTooltip}
            onBlur={() => setTooltipPosition(null)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            i
          </button>
          {tooltipPosition && (
            <div
              className="pointer-events-none fixed z-50 max-w-[260px] rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-white shadow-xl"
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
  );
}

function Tasks() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isManager = currentUser?.role === "manager";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("assigned");

  const isModalOpen = Boolean(modalMode);
  const modalTitle = modalMode === "edit" ? "Edit Task" : "Create Task";
  const visibleTabs = isManager
    ? [
        { id: "assigned", label: "Assigned" },
        { id: "created", label: "Created" },
      ]
    : [{ id: "assigned", label: "Assigned" }];
  const showAssigneeColumn = activeTab === "created";
  const showAssignedByColumn = activeTab === "assigned";
  const displayedTasks = useMemo(() => tasks, [tasks]);

  function handleAuthError(apiError) {
    if (apiError?.status === 401) {
      logout(navigate);
      return true;
    }

    return false;
  }

  function getTaskFilters() {
    if (activeTab === "assigned" && currentUser?.id) {
      return { assignee: currentUser.id };
    }

    return {};
  }

  async function loadTasks() {
    setIsLoading(true);
    setError("");

    try {
      const taskData = await getTasks(getTaskFilters());
      setTasks(listFromResponse(taskData));

      if (isManager) {
        const [projectData, userData] = await Promise.all([getProjects(), getUsers()]);
        setProjects(listFromResponse(projectData));
        setUsers(listFromResponse(userData));
      }
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not load tasks.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  useEffect(() => {
    if (!isManager) {
      setActiveTab("assigned");
    }
  }, [isManager]);

  function openCreateModal() {
    setModalMode("create");
    setSelectedTask(null);
    setFormValues({
      ...emptyForm,
      project: projects[0]?.id ? String(projects[0].id) : "",
    });
    setError("");
    setSuccessMessage("");
  }

  function openEditModal(task) {
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
    setError("");
    setSuccessMessage("");
  }

  function closeModal({ force = false } = {}) {
    if (isSaving && !force) {
      return;
    }

    setModalMode(null);
    setSelectedTask(null);
    setFormValues(emptyForm);
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
    setSuccessMessage("");

    try {
      if (modalMode === "edit" && selectedTask) {
        await updateTask(selectedTask.id, buildTaskPayload());
        setSuccessMessage("Task updated successfully.");
      } else {
        await createTask(buildTaskPayload());
        setSuccessMessage("Task created successfully.");
      }

      closeModal({ force: true });
      await loadTasks();
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not save task.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(task, status) {
    setError("");
    setSuccessMessage("");

    try {
      await updateTask(task.id, { status });
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status } : item)),
      );
      setSuccessMessage("Task status updated successfully.");
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not update task status.");
      }
    }
  }

  function openDeleteModal(task) {
    setTaskToDelete(task);
    setError("");
    setSuccessMessage("");
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteTask(taskToDelete.id);
      setTasks((current) => current.filter((task) => task.id !== taskToDelete.id));
      setSuccessMessage("Task deleted successfully.");
      setTaskToDelete(null);
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not delete task.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager ? "Manage project tasks" : "Work on your assigned tasks"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex self-start rounded border border-slate-200 bg-white p-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isManager && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Create Task
          </button>
        )}
      </div>

      {successMessage && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {error && !isModalOpen && !taskToDelete && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading tasks...</div>
        ) : displayedTasks.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No tasks found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Project</th>
                  {showAssigneeColumn && <th className="px-4 py-3">Assignee</th>}
                  {showAssignedByColumn && <th className="px-4 py-3">Assigned By</th>}
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  {isManager && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTasks.map((task) => (
                  <tr key={task.id} className="align-top">
                    <td className="max-w-sm px-4 py-3">
                      <TaskTitle task={task} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.project_name || `Project #${task.project}`}
                    </td>
                    {showAssigneeColumn && (
                      <td className="px-4 py-3 text-slate-600">
                        {task.assignee_name || task.assignee_email || "-"}
                      </td>
                    )}
                    {showAssignedByColumn && (
                      <td className="px-4 py-3 text-slate-600">
                        {task.assigned_by_name || task.assigned_by_email || "-"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTimeIST(task.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(event) => handleStatusChange(task, event.target.value)}
                        className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {isManager && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(task)}
                            className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
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

      {isModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <section className="w-full max-w-lg rounded border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">{modalTitle}</h2>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="project">
                  Project
                </label>
                <select
                  id="project"
                  value={formValues.project}
                  onChange={(event) => updateFormValue("project", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
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
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formValues.title}
                  onChange={(event) => updateFormValue("title", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows="3"
                  value={formValues.description}
                  onChange={(event) => updateFormValue("description", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="assignee"
                  >
                    Assignee
                  </label>
                  <select
                    id="assignee"
                    value={formValues.assignee}
                    onChange={(event) => updateFormValue("assignee", event.target.value)}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
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
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formValues.status}
                    onChange={(event) => updateFormValue("status", event.target.value)}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
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
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="due_date">
                  Due Date
                </label>
                <input
                  id="due_date"
                  type="datetime-local"
                  value={formValues.due_date}
                  onChange={(event) => updateFormValue("due_date", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? "Saving..." : "Save Task"}
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
