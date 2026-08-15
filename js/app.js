import { loadTasks, saveTasks } from "./store.js";
import { elements, getTaskFormValues, openTaskModal, closeTaskModal, populateTaskForm, renderTasks, resetTaskForm, setActiveFilter, showTitleError, showToast, updateSummary } from "./ui.js";

const THEME_KEY = "focus-todo.theme.v1";
const USER_NAME_KEY = "focus-todo.user-name.v1";
const state = { tasks: loadTasks(), filter: "active", deferredInstallPrompt: null };

function persist() {
  if (!saveTasks(state.tasks)) showToast("Tasks could not be saved in this browser.");
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getVisibleTasks() {
  return sortTasks(state.tasks).filter(task => state.filter === "active" ? !task.completed : task.completed);
}

function refresh() {
  renderTasks(getVisibleTasks(), state.filter);
  updateSummary(state.tasks, state.filter);
  setActiveFilter(state.filter);
}

function handleSubmit(event) {
  event.preventDefault();
  const values = getTaskFormValues();
  if (!values.title) {
    showTitleError("Enter a task title.");
    elements.title.focus();
    return;
  }

  const now = new Date().toISOString();
  if (values.id) {
    const task = state.tasks.find(item => item.id === values.id);
    if (task) Object.assign(task, { title: values.title, description: values.description, dueDate: values.dueDate, priority: values.priority, updatedAt: now });
    showToast("Task updated.");
  } else {
    state.tasks.push({ ...values, id: crypto.randomUUID(), completed: false, createdAt: now, updatedAt: now });
    state.filter = "active";
    showToast("Task added.");
  }

  persist();
  closeTaskModal();
  refresh();
}

function finishTaskToggle(task) {
  task.completed = !task.completed;
  task.updatedAt = new Date().toISOString();
  persist();
  refresh();
  showToast(task.completed ? "Task completed." : "Task reopened.");
}

function toggleTask(taskId, card) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;

  if (!task.completed && card) {
    card.classList.add("is-completing");
    const checkbox = card.querySelector(".task-checkbox");
    if (checkbox) checkbox.disabled = true;
    const delay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520;
    window.setTimeout(() => finishTaskToggle(task), delay);
    return;
  }

  finishTaskToggle(task);
}

function editTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  populateTaskForm(task);
  openTaskModal();
}

function deleteTask(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || !window.confirm(`Delete “${task.title}”?`)) return;
  state.tasks = state.tasks.filter(item => item.id !== taskId);
  persist();
  refresh();
  showToast("Task deleted.");
}

function clearCompleted() {
  const count = state.tasks.filter(task => task.completed).length;
  if (!count || !window.confirm(`Delete ${count} completed ${count === 1 ? "task" : "tasks"}?`)) return;
  state.tasks = state.tasks.filter(task => !task.completed);
  persist();
  refresh();
  showToast("Completed tasks cleared.");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.themeIcon.textContent = dark ? "☀️" : "🌙";
  elements.themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0b1220" : "#f5f7fb";
}

function initialiseTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function openNameModal() {
  const savedName = localStorage.getItem(USER_NAME_KEY) || "";
  elements.userName.value = savedName;
  elements.nameModal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => elements.userName.focus());
}

function setGreeting(name) {
  elements.greeting.textContent = name ? `Hello, ${name} 👋` : "Hello 👋";
}

function handleNameSubmit(event) {
  event.preventDefault();
  const name = elements.userName.value.trim();
  if (!name) {
    elements.nameError.textContent = "Enter your name to continue.";
    elements.userName.focus();
    return;
  }
  localStorage.setItem(USER_NAME_KEY, name);
  setGreeting(name);
  elements.nameError.textContent = "";
  elements.nameModal.hidden = true;
  document.body.classList.remove("modal-open");
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  elements.installButton.hidden = true;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); }
  catch (error) { console.error("Service worker registration failed:", error); }
}

elements.form.addEventListener("submit", handleSubmit);
elements.addTaskButton.addEventListener("click", () => { resetTaskForm(); openTaskModal(); });
elements.closeTaskModalButton.addEventListener("click", closeTaskModal);
document.querySelector("[data-close-task-modal]").addEventListener("click", closeTaskModal);
elements.cancelEditButton.addEventListener("click", closeTaskModal);
elements.title.addEventListener("input", () => showTitleError());
elements.clearCompletedButton.addEventListener("click", clearCompleted);
elements.themeButton.addEventListener("click", toggleTheme);
elements.settingsButton.addEventListener("click", openNameModal);
elements.nameForm.addEventListener("submit", handleNameSubmit);
elements.userName.addEventListener("input", () => { elements.nameError.textContent = ""; });
elements.installButton.addEventListener("click", installApp);

elements.taskList.addEventListener("change", event => {
  if (!(event.target instanceof HTMLInputElement) || event.target.dataset.action !== "toggle") return;
  const card = event.target.closest("[data-task-id]");
  if (card) toggleTask(card.dataset.taskId, card);
});

elements.taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  const card = button?.closest("[data-task-id]");
  if (!button || !card) return;
  if (button.dataset.action === "edit") editTask(card.dataset.taskId);
  if (button.dataset.action === "delete") deleteTask(card.dataset.taskId);
});

elements.filterButtons.forEach(button => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  refresh();
}));

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !elements.taskModal.hidden) closeTaskModal();
});
window.addEventListener("online", () => showToast("Back online."));
window.addEventListener("offline", () => showToast("Offline — your local tasks still work."));
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  state.deferredInstallPrompt = event;
  elements.installButton.hidden = false;
});
window.addEventListener("appinstalled", () => { elements.installButton.hidden = true; });

initialiseTheme();
const savedName = localStorage.getItem(USER_NAME_KEY) || "";
setGreeting(savedName);
refresh();
if (!savedName) openNameModal();
setInterval(refresh, 60_000);
registerServiceWorker();
