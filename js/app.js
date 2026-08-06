import { loadTasks, saveTasks } from "./store.js";
import {
  elements,
  getTaskFormValues,
  populateTaskForm,
  renderTasks,
  resetTaskForm,
  setActiveFilter,
  showTitleError,
  showToast,
  updateConnectionStatus,
  updateSummary
} from "./ui.js";

const THEME_STORAGE_KEY = "focus-todo-theme";

const state = {
  tasks: loadTasks(),
  filter: "all",
  search: "",
  deferredInstallPrompt: null,
  theme: document.documentElement.dataset.theme || "light"
};

function applyTheme(theme, persistPreference = true) {
  const isDark = theme === "dark";
  state.theme = isDark ? "dark" : "light";

  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  elements.themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
  elements.themeIcon.textContent = isDark ? "☀" : "☾";
  elements.themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  elements.themeColor.content = isDark ? "#0b1220" : "#1d4ed8";

  if (persistPreference) {
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  }
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function persist() {
  if (!saveTasks(state.tasks)) {
    showToast("Tasks could not be saved in this browser.");
  }
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);

    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getVisibleTasks() {
  const search = state.search.toLocaleLowerCase();

  return sortTasks(state.tasks).filter(task => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "active" && !task.completed) ||
      (state.filter === "completed" && task.completed);

    const matchesSearch =
      !search ||
      task.title.toLocaleLowerCase().includes(search) ||
      task.description.toLocaleLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });
}

function refresh() {
  renderTasks(getVisibleTasks(), state.tasks.length);
  updateSummary(state.tasks);
  setActiveFilter(state.filter);
}

function createTask(values) {
  const now = new Date().toISOString();

  state.tasks.push({
    id: crypto.randomUUID(),
    title: values.title,
    description: values.description,
    completed: false,
    priority: values.priority,
    dueDate: values.dueDate,
    createdAt: now,
    updatedAt: now
  });

  showToast("Task added.");
}

function updateTask(values) {
  const task = state.tasks.find(item => item.id === values.id);
  if (!task) return;

  Object.assign(task, {
    title: values.title,
    description: values.description,
    priority: values.priority,
    dueDate: values.dueDate,
    updatedAt: new Date().toISOString()
  });

  showToast("Task updated.");
}

function handleSubmit(event) {
  event.preventDefault();

  const values = getTaskFormValues();
  if (!values.title) {
    showTitleError("Enter a task title.");
    elements.title.focus();
    return;
  }

  showTitleError();

  if (values.id) {
    updateTask(values);
  } else {
    createTask(values);
  }

  persist();
  resetTaskForm();
  refresh();
}

function toggleTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  task.updatedAt = new Date().toISOString();
  persist();
  refresh();
  showToast(task.completed ? "Task completed." : "Task reopened.");
}

function editTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (task) populateTaskForm(task);
}

function deleteTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  const confirmed = window.confirm(`Delete “${task.title}”?`);
  if (!confirmed) return;

  state.tasks = state.tasks.filter(item => item.id !== taskId);

  if (elements.taskId.value === taskId) {
    resetTaskForm();
  }

  persist();
  refresh();
  showToast("Task deleted.");
}

function handleTaskListChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.dataset.action !== "toggle") return;

  const card = target.closest("[data-task-id]");
  if (card) toggleTask(card.dataset.taskId);
}

function handleTaskListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest("[data-task-id]");
  if (!card) return;

  if (button.dataset.action === "edit") editTask(card.dataset.taskId);
  if (button.dataset.action === "delete") deleteTask(card.dataset.taskId);
}

function clearCompleted() {
  const completedCount = state.tasks.filter(task => task.completed).length;
  if (!completedCount) return;

  const confirmed = window.confirm(
    `Delete ${completedCount} completed ${completedCount === 1 ? "task" : "tasks"}?`
  );
  if (!confirmed) return;

  state.tasks = state.tasks.filter(task => !task.completed);
  persist();
  resetTaskForm();
  refresh();
  showToast("Completed tasks cleared.");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;

  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  elements.installButton.hidden = true;
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.cancelEditButton.addEventListener("click", resetTaskForm);
  elements.title.addEventListener("input", () => showTitleError());
  elements.taskList.addEventListener("change", handleTaskListChange);
  elements.taskList.addEventListener("click", handleTaskListClick);
  elements.clearCompletedButton.addEventListener("click", clearCompleted);
  elements.installButton.addEventListener("click", installApp);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.searchInput.addEventListener("input", event => {
    state.search = event.target.value.trim();
    refresh();
  });

  elements.filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      refresh();
    });
  });

  window.addEventListener("online", () => {
    updateConnectionStatus(true);
    showToast("You are back online.");
  });

  window.addEventListener("offline", () => {
    updateConnectionStatus(false);
    showToast("You are offline. Your local tasks still work.");
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    elements.installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    elements.installButton.hidden = true;
    showToast("Focus Todo installed.");
  });
}

applyTheme(state.theme, false);
bindEvents();
updateConnectionStatus(navigator.onLine);
refresh();
registerServiceWorker();
