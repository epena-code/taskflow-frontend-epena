import React, { useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, saveToken } from "./api";

const emptyTask = {
  title: "",
  description: "",
  status: "pending"
};

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");

  async function loadSession() {
    try {
      const data = await api.me();
      setUser(data.user);
      await loadTasks();
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    const data = await api.listTasks();
    setTasks(data.tasks);
    setSummary(data.summary);
  }

  useEffect(() => {
    if (getToken()) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, []);

  async function handleLogin(email, password) {
    setError("");
    try {
      const data = await api.login(email, password);
      saveToken(data.token);
      setUser(data.user);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setTasks([]);
    setSummary({ total: 0, pending: 0, completed: 0 });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
          Cargando TaskFlow...
        </div>
      </main>
    );
  }

  if (!user) {
    return <LoginPage error={error} onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      setUser={setUser}
      tasks={tasks}
      summary={summary}
      onRefresh={loadTasks}
      onLogout={handleLogout}
    />
  );
}

function LoginPage({ error, onLogin }) {
  const [email, setEmail] = useState("demo@taskflow.local");
  const [password, setPassword] = useState("TaskFlow123");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="text-white">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            CloudFlow</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Gestiona tus actividades y controla tu progreso desde una plataforma desplegada en AWS.
          </p>
          <p className="mt-3 max-w-xl text-md leading-8 text-slate-300">
            Proyecto final de Erick Peña - Cloud AWS.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-950/40">
          <h2 className="text-2xl font-bold text-slate-950">Iniciar sesión</h2>

          <form className="mt-6 space-y-5" onSubmit={submit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Correo</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Contraseña
              </span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={submitting}
            >
              {submitting ? "Ingresando..." : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Dashboard({ user, setUser, tasks, summary, onRefresh, onLogout }) {
  const [activeView, setActiveView] = useState("tasks");

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">TaskFlow</p>
            <h1 className="text-xl font-black text-slate-950">
              Panel de tareas
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              {user.name}
            </span>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total de tareas" value={summary.total} tone="blue" />
          <StatCard label="Pendientes" value={summary.pending} tone="amber" />
          <StatCard label="Completadas" value={summary.completed} tone="green" />
        </section>

        <nav className="mt-8 flex gap-3">
          <TabButton
            active={activeView === "tasks"}
            onClick={() => setActiveView("tasks")}
          >
            Tareas
          </TabButton>
          <TabButton
            active={activeView === "profile"}
            onClick={() => setActiveView("profile")}
          >
            Perfil
          </TabButton>
        </nav>

        <section className="mt-6">
          {activeView === "tasks" ? (
            <TasksPanel tasks={tasks} onRefresh={onRefresh} />
          ) : (
            <ProfilePanel user={user} setUser={setUser} />
          )}
        </section>
      </div>
    </main>
  );
}

function TasksPanel({ tasks, onRefresh }) {
  const [form, setForm] = useState(emptyTask);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const sortedTasks = useMemo(() => tasks, [tasks]);

  function startEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyTask);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateTask(editingId, form);
      } else {
        await api.createTask(form);
      }
      resetForm();
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(task) {
    await api.updateTask(task.id, {
      ...task,
      status: task.status === "completed" ? "pending" : "completed"
    });
    await onRefresh();
  }

  async function deleteTask(task) {
    await api.deleteTask(task.id);
    await onRefresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form className="rounded-2xl bg-white p-6 shadow-sm" onSubmit={submit}>
        <h2 className="text-xl font-black text-slate-950">
          {editingId ? "Editar tarea" : "Nueva tarea"}
        </h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Título</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Ej. Revisar logs en CloudWatch"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Descripción
            </span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
              placeholder="Detalle breve de la tarea"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Estado</span>
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
            </select>
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
              {editingId ? "Guardar cambios" : "Crear tarea"}
            </button>
            {editingId && (
              <button
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={resetForm}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Mis tareas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea, completa o edita tareas desde la API REST.
            </p>
          </div>
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            onClick={onRefresh}
          >
            Actualizar
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {sortedTasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No hay tareas registradas.
            </div>
          )}

          {sortedTasks.map((task) => (
            <article
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              key={task.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{task.title}</h3>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {task.description || "Sin descripción."}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Creada: {formatDate(task.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                    onClick={() => toggleStatus(task)}
                  >
                    {task.status === "completed" ? "Reabrir" : "Completar"}
                  </button>
                  <button
                    className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                    onClick={() => startEdit(task)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200"
                    onClick={() => deleteTask(task)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ user, setUser }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await api.updateProfile(form);
      setUser(data.user);
      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm" onSubmit={submit}>
      <h2 className="text-xl font-black text-slate-950">Perfil</h2>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nombre</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Correo</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>

        {message && (
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
          Guardar perfil
        </button>
      </div>
    </form>
  );
}

function StatCard({ label, value, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700"
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <strong className="text-4xl font-black text-slate-950">{value}</strong>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
          TaskFlow
        </span>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`rounded-xl px-5 py-3 text-sm font-black transition ${
        active
          ? "bg-slate-950 text-white"
          : "bg-white text-slate-600 hover:bg-slate-200"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const completed = status === "completed";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {completed ? "Completada" : "Pendiente"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default App;
