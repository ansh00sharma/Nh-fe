import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";
import { createUser, getUsers, updateUser } from "../api/users.js";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  role: "agent",
  password: "",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function userListFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);

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
        setError(apiError.message || "Could not load users.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreateModal() {
    setModalMode("create");
    setSelectedUser(null);
    setFormValues(emptyForm);
    setError("");
    setSuccessMessage("");
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
    setSuccessMessage("");
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
    setSuccessMessage("");

    try {
      if (modalMode === "edit" && selectedUser) {
        await updateUser(selectedUser.id, payload);
        setSuccessMessage("User updated successfully.");
      } else {
        await createUser(payload);
        setSuccessMessage("User created successfully.");
      }

      closeModal({ force: true });
      await loadUsers();
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not save user.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage user accounts</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Create User
        </button>
      </div>

      {successMessage && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {error && !isModalOpen && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading users...</div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{user.role || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(user.updated_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <section className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">{modalTitle}</h2>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="first_name"
                  >
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={formValues.first_name}
                    onChange={(event) => updateFormValue("first_name", event.target.value)}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="last_name"
                  >
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={formValues.last_name}
                    onChange={(event) => updateFormValue("last_name", event.target.value)}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => updateFormValue("email", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  value={formValues.role}
                  onChange={(event) => updateFormValue("role", event.target.value)}
                  className="block w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
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
                  {isSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Users;
