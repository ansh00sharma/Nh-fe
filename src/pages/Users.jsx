import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";
import { createUser, deleteUser, getUsers, updateUser } from "../api/users.js";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import { formatDateTimeIST } from "../utils/datetime.js";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  role: "agent",
  password: "",
};

const roleStyles = {
  admin: "border-teal-200 bg-teal-50 text-teal-700",
  manager: "border-amber-200 bg-amber-50 text-amber-700",
  agent: "border-sky-200 bg-sky-50 text-sky-700",
};

const roleLabels = {
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
};

function userListFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function getUserName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function getInitials(user) {
  const nameSource = [user.first_name, user.last_name].filter(Boolean);

  if (nameSource.length > 0) {
    return nameSource.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  return user.email?.slice(0, 2).toUpperCase() || "?";
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

function MailIcon() {
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
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 7 5 7-5" />
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

function UsersToast({ toast, onClose }) {
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

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const isModalOpen = Boolean(modalMode);
  const modalTitle = modalMode === "edit" ? "Edit User" : "Create User";
  const sortedUsers = useMemo(() => users, [users]);

  function handleAuthError(apiError) {
    if (apiError?.status === 401) {
      logout(navigate);
      return true;
    }

    return false;
  }

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(userListFromResponse(data));
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not load users.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
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

  function openCreateModal() {
    setModalMode("create");
    setSelectedUser(null);
    setFormValues(emptyForm);
    setError("");
    setToast(null);
  }

  function openEditModal(user) {
    setModalMode("edit");
    setSelectedUser(user);
    setFormValues({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      role: user.role ?? "agent",
      password: "",
    });
    setError("");
    setToast(null);
  }

  function closeModal({ force = false } = {}) {
    if (isSaving && !force) {
      return;
    }

    setModalMode(null);
    setSelectedUser(null);
    setFormValues(emptyForm);
  }

  function updateFormValue(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!formValues.first_name.trim()) {
      return "First name is required.";
    }
    if (!formValues.last_name.trim()) {
      return "Last name is required.";
    }
    if (!formValues.email.trim()) {
      return "Email is required.";
    }
    if (modalMode === "create" && !formValues.password) {
      return "Password is required.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      first_name: formValues.first_name.trim(),
      last_name: formValues.last_name.trim(),
      email: formValues.email.trim(),
      role: formValues.role,
    };

    if (formValues.password) {
      payload.password = formValues.password;
    }

    setIsSaving(true);
    setError("");

    try {
      if (modalMode === "edit" && selectedUser) {
        await updateUser(selectedUser.id, payload);
        setToast({ type: "success", message: "User updated successfully." });
      } else {
        await createUser(payload);
        setToast({ type: "success", message: "User created successfully." });
      }

      closeModal({ force: true });
      await loadUsers();
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not save user.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal(user) {
    setUserToDelete(user);
    setError("");
    setToast(null);
  }

  async function confirmDeleteUser() {
    if (!userToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteUser(userToDelete.id);
      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      setToast({ type: "success", message: "User deleted successfully." });
      setUserToDelete(null);
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        const message = apiError.message || "Could not delete user.";
        setError(message);
        setToast({ type: "error", message });
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <UsersToast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Users</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage user accounts, roles, and team access.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-teal-900/20 focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <PlusIcon />
          Create User
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/[0.04]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Team Directory</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <MailIcon />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-950">No users found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create your first user to start assigning work across TaskFlow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group align-middle transition hover:bg-teal-50/35"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-slate-800 to-teal-700 text-sm font-bold text-white shadow-md shadow-slate-900/10">
                          {getInitials(user)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">{getUserName(user)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-xs items-center gap-2 text-slate-600">
                        <span className="truncate font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                          roleStyles[user.role] || "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {roleLabels[user.role] || user.role || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {formatDateTimeIST(user.created_at)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {formatDateTimeIST(user.updated_at)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        >
                          <PencilIcon />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(user)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="modal-card w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-teal-700 text-white shadow-lg shadow-slate-900/15">
                  <PlusIcon />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{modalTitle}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {modalMode === "edit"
                      ? "Update account details and role access."
                      : "Add a teammate and assign their access role."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close user modal"
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

            <form className="space-y-5 p-6" onSubmit={handleSubmit}>
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
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="first_name"
                  >
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={formValues.first_name}
                    onChange={(event) => updateFormValue("first_name", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="last_name"
                  >
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={formValues.last_name}
                    onChange={(event) => updateFormValue("last_name", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) => updateFormValue("email", event.target.value)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-0 pl-10 pr-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  value={formValues.role}
                  onChange={(event) => updateFormValue("role", event.target.value)}
                  className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-bold text-slate-700"
                  htmlFor="password"
                >
                  {modalMode === "edit" ? "New Password" : "Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formValues.password}
                  onChange={(event) => updateFormValue("password", event.target.value)}
                  placeholder={modalMode === "edit" ? "Leave blank to keep current password" : ""}
                  className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
                {modalMode === "edit" && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Keep this empty if the password should not change.
                  </p>
                )}
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Save User
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {userToDelete && (
        <DeleteConfirmationModal
          title="Delete User"
          description={`Are you sure you want to delete "${userToDelete.email}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setUserToDelete(null);
            }
          }}
          onDelete={confirmDeleteUser}
        />
      )}
    </div>
  );
}

export default Users;
