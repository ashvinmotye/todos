export const elements = {
  form: document.querySelector("#taskForm"),
  formTitle: document.querySelector("#taskFormTitle"),
  taskId: document.querySelector("#taskId"),
  title: document.querySelector("#taskTitle"),
  description: document.querySelector("#taskDescription"),
  dueDate: document.querySelector("#taskDueDate"),
  priority: document.querySelector("#taskPriority"),
  titleError: document.querySelector("#titleError"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  taskList: document.querySelector("#taskList"),
  taskTemplate: document.querySelector("#taskTemplate"),
  emptyState: document.querySelector("#emptyState"),
  taskSummary: document.querySelector("#taskSummary"),
  searchInput: document.querySelector("#searchInput"),
  filterButtons: [...document.querySelectorAll("[data-filter]")],
  clearCompletedButton: document.querySelector("#clearCompletedButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  installButton: document.querySelector("#installButton"),
  themeToggle: document.querySelector("#themeToggle"),
  themeIcon: document.querySelector("#themeIcon"),
  themeLabel: document.querySelector("#themeLabel"),
  themeColor: document.querySelector("#themeColor"),
  toast: document.querySelector("#toast")
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric"
});

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

let toastTimer;
let remainingTimeTimer;

function getLocalToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDueDate(dueDate) {
  if (!dueDate) return "";
  const date = new Date(`${dueDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dueDate : dateFormatter.format(date);
}

function getRemainingTime(deadlineValue) {
  const deadline = new Date(deadlineValue);
  const remainingMs = deadline.getTime() - Date.now();

  if (Number.isNaN(deadline.getTime())) {
    return { label: "", urgency: "low", overdue: false };
  }

  if (remainingMs < 0) {
    return { label: "Overdue", urgency: "high", overdue: true };
  }

  if (remainingMs < DAY_IN_MS) {
    const hours = Math.max(1, Math.ceil(remainingMs / HOUR_IN_MS));
    return {
      label: `${hours} ${hours === 1 ? "hour" : "hours"} left`,
      urgency: "high",
      overdue: false
    };
  }

  const days = Math.ceil(remainingMs / DAY_IN_MS);
  return {
    label: `${days} ${days === 1 ? "day" : "days"} left`,
    urgency: days <= 3 ? "medium" : "low",
    overdue: false
  };
}

function updateRemainingTimeBadge(badge) {
  const remaining = getRemainingTime(badge.dataset.deadline);

  badge.textContent = remaining.label;
  badge.classList.remove("priority-low", "priority-medium", "priority-high");
  badge.classList.add(`priority-${remaining.urgency}`);
  badge.closest(".task-meta")?.classList.toggle("is-overdue", remaining.overdue);
}

function updateRemainingTimeBadges() {
  document.querySelectorAll("[data-deadline]").forEach(updateRemainingTimeBadge);
}

function startRemainingTimeTimer() {
  if (remainingTimeTimer) return;

  remainingTimeTimer = window.setInterval(updateRemainingTimeBadges, 60_000);
}

export function getTaskFormValues() {
  return {
    id: elements.taskId.value,
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    dueDate: elements.dueDate.value,
    priority: elements.priority.value
  };
}

export function showTitleError(message = "") {
  elements.titleError.textContent = message;
  elements.title.setAttribute("aria-invalid", String(Boolean(message)));
}

export function resetTaskForm() {
  elements.form.reset();
  elements.taskId.value = "";
  elements.priority.value = "medium";
  elements.formTitle.textContent = "Add a task";
  elements.submitButton.textContent = "Add task";
  elements.cancelEditButton.hidden = true;
  showTitleError();
}

export function populateTaskForm(task) {
  elements.taskId.value = task.id;
  elements.title.value = task.title;
  elements.description.value = task.description;
  elements.dueDate.value = task.dueDate;
  elements.priority.value = task.priority;
  elements.formTitle.textContent = "Edit task";
  elements.submitButton.textContent = "Save changes";
  elements.cancelEditButton.hidden = false;
  showTitleError();
  elements.title.focus();
}

export function setActiveFilter(filter) {
  elements.filterButtons.forEach(button => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

export function renderTasks(tasks, totalCount) {
  elements.taskList.replaceChildren();

  for (const task of tasks) {
    const fragment = elements.taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const checkbox = fragment.querySelector(".task-checkbox");
    const title = fragment.querySelector(".task-title");
    const description = fragment.querySelector(".task-description");
    const meta = fragment.querySelector(".task-meta");
    const badge = fragment.querySelector(".priority-badge");
    const editButton = fragment.querySelector(".edit-button");
    const deleteButton = fragment.querySelector(".delete-button");

    card.dataset.taskId = task.id;
    card.classList.toggle("is-completed", task.completed);

    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute(
      "aria-label",
      task.completed
        ? `Mark ${task.title} as active`
        : `Mark ${task.title} as complete`
    );

    title.textContent = task.title;
    description.textContent = task.description;

    badge.textContent = task.priority;
    badge.classList.add(`priority-${task.priority}`);

    if (task.dueDate) {
      const dueDateText = document.createTextNode(`Due ${formatDueDate(task.dueDate)} `);
      meta.replaceChildren(dueDateText);

      if (!task.completed) {
        const remainingBadge = document.createElement("span");
        remainingBadge.className = "priority-badge";
        remainingBadge.dataset.deadline = `${task.dueDate}T23:59:59.999`;
        remainingBadge.style.marginInlineStart = "6px";
        remainingBadge.style.textTransform = "none";
        meta.append(remainingBadge);
        updateRemainingTimeBadge(remainingBadge);
      }
    } else {
      meta.textContent = "No due date";
    }

    editButton.dataset.action = "edit";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);

    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    elements.taskList.append(fragment);
  }

  const visibleCount = tasks.length;
  const hiddenByFilter = totalCount !== visibleCount;

  elements.emptyState.hidden = visibleCount > 0;
  elements.emptyState.querySelector("h3").textContent = hiddenByFilter
    ? "No matching tasks"
    : "No tasks yet";
  elements.emptyState.querySelector("p").textContent = hiddenByFilter
    ? "Try another filter or search term."
    : "Add your first task using the form.";

  startRemainingTimeTimer();
}

export function updateSummary(tasks) {
  const activeCount = tasks.filter(task => !task.completed).length;
  const completedCount = tasks.length - activeCount;
  const taskWord = tasks.length === 1 ? "task" : "tasks";

  elements.taskSummary.textContent = `${tasks.length} ${taskWord} · ${activeCount} active`;
  elements.clearCompletedButton.disabled = completedCount === 0;
}

export function updateConnectionStatus(isOnline) {
  elements.connectionStatus.textContent = isOnline ? "Online" : "Offline";
  elements.connectionStatus.classList.toggle("is-offline", !isOnline);
}

export function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}