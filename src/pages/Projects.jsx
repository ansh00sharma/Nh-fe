import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../api/projects.js";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import { formatDateTimeIST } from "../utils/datetime.js";

const emptyForm = {
  name: "",
  description: "",
};

function projectListFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);

  const isModalOpen = Boolean(modalMode);
  const modalTitle = modalMode === "edit" ? "Edit Project" : "Create Project";
  const sortedProjects = useMemo(() => projects, [projects]);

  function handleAuthError(apiError) {
    if (apiError?.status === 401) {
      logout(navigate);
      return true;
    }

    return false;
  }

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const data = await getProjects();
      setProjects(projectListFromResponse(data));
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not load projects.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function openCreateModal() {
    setModalMode("create");
    setSelectedProject(null);
    setFormValues(emptyForm);
    setError("");
    setSuccessMessage("");
  }

  function openEditModal(project) {
    setModalMode("edit");
    setSelectedProject(project);
    setFormValues({
      name: project.name ?? "",
      description: project.description ?? "",
    });
    setError("");
    setSuccessMessage("");
  }

  function closeModal({ force = false } = {}) {
    if (isSaving && !force) {
      return;
    }

    setModalMode(null);
    setSelectedProject(null);
    setFormValues(emptyForm);
  }

  function updateFormValue(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
    };

    if (!payload.name) {
      setError("Project name is required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (modalMode === "edit" && selectedProject) {
        await updateProject(selectedProject.id, payload);
        setSuccessMessage("Project updated successfully.");
      } else {
        await createProject(payload);
        setSuccessMessage("Project created successfully.");
      }

      closeModal({ force: true });
      await loadProjects();
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not save project.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(project) {
    setProjectToDelete(project);
    setError("");
    setSuccessMessage("");
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteProject(projectToDelete.id);
      setProjects((current) => current.filter((item) => item.id !== projectToDelete.id));
      setSuccessMessage("Project deleted successfully.");
      setProjectToDelete(null);
    } catch (apiError) {
      if (!handleAuthError(apiError)) {
        setError(apiError.message || "Could not delete project.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your projects</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Create Project
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
          <div className="p-6 text-sm text-slate-500">Loading projects...</div>
        ) : sortedProjects.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No projects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProjects.map((project) => (
                  <tr key={project.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
                    <td className="max-w-md px-4 py-3 text-slate-600">
                      {project.description || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTimeIST(project.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTimeIST(project.updated_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project)}
                          className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formValues.name}
                  onChange={(event) => updateFormValue("name", event.target.value)}
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
                  rows="4"
                  value={formValues.description}
                  onChange={(event) => updateFormValue("description", event.target.value)}
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
                  {isSaving ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {projectToDelete && (
        <DeleteConfirmationModal
          title="Delete Project"
          description={`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.`}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setProjectToDelete(null);
            }
          }}
          onDelete={confirmDeleteProject}
        />
      )}
    </div>
  );
}

export default Projects;
