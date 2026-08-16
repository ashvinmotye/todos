export const elements = {
  form: document.querySelector("#taskForm"),
  formTitle: document.querySelector("#taskFormTitle"),
  formKicker: document.querySelector("#taskFormKicker"),
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
  filterButtons: [...document.querySelectorAll("[data-filter]")],
  activeCount: document.querySelector("#activeCount"),
  completedCount: document.querySelector("#completedCount"),
  clearCompletedButton: document.querySelector("#clearCompletedButton"),
  boardFooter: document.querySelector("#boardFooter"),
  installButton: document.querySelector("#installButton"),
  addTaskButton: document.querySelector("#addTaskButton"),
  taskModal: document.querySelector("#taskModal"),
  closeTaskModalButton: document.querySelector("#closeTaskModalButton"),
  themeButton: document.querySelector("#themeButton"),
  themeIcon: document.querySelector("#themeIcon"),
  settingsButton: document.querySelector("#settingsButton"),
  greeting: document.querySelector("#greeting"),
  nameModal: document.querySelector("#nameModal"),
  nameForm: document.querySelector("#nameForm"),
  userName: document.querySelector("#userName"),
  nameError: document.querySelector("#nameError"),
  toast: document.querySelector("#toast")
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });
let toastTimer;

function formatDueDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function deadlineTime(value) {
  if (!value) return Number.NaN;
  return new Date(`${value}T23:59:59.999`).getTime();
}

function getTimeLeft(value) {
  const difference = deadlineTime(value) - Date.now();
  if (!Number.isFinite(difference)) return null;
  if (difference < 0) return { label: "Overdue", tone: "danger" };
  const hours = Math.ceil(difference / 3_600_000);
  if (difference < 86_400_000) return { label: `${hours} ${hours === 1 ? "hour" : "hours"} left`, tone: "danger" };
  const days = Math.ceil(difference / 86_400_000);
  return { label: `${days} ${days === 1 ? "day" : "days"} left`, tone: days <= 3 ? "warning" : "normal" };
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
  elements.formKicker.textContent = "NEW MISSION";
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
  elements.formKicker.textContent = "EDIT MISSION";
  elements.formTitle.textContent = "Edit task";
  elements.submitButton.textContent = "Save changes";
  elements.cancelEditButton.hidden = false;
  showTitleError();
}

export function openTaskModal() {
  elements.taskModal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => elements.title.focus());
}

export function closeTaskModal() {
  elements.taskModal.hidden = true;
  document.body.classList.remove("modal-open");
  resetTaskForm();
  elements.addTaskButton.focus();
}

export function setActiveFilter(filter) {
  elements.filterButtons.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

export function renderTasks(tasks, filter) {
  elements.taskList.replaceChildren();

  for (const task of tasks) {
    const fragment = elements.taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const checkbox = fragment.querySelector(".task-checkbox");
    const title = fragment.querySelector(".task-title");
    const description = fragment.querySelector(".task-description");
    const dueDate = fragment.querySelector(".due-date");
    const timeBadge = fragment.querySelector(".time-left-badge");
    const priority = fragment.querySelector(".priority-badge");
    const editButton = fragment.querySelector(".edit-button");
    const deleteButton = fragment.querySelector(".delete-button");

    card.dataset.taskId = task.id;
    card.classList.add(`priority-${task.priority}`);
    card.classList.toggle("is-completed", task.completed);
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", task.completed ? `Mark ${task.title} as active` : `Mark ${task.title} as complete`);
    title.textContent = task.title;
    description.textContent = task.description;
    priority.textContent = task.priority;

    if (task.dueDate) {
      dueDate.textContent = `Due ${formatDueDate(task.dueDate)}`;
      if (!task.completed) {
        const remaining = getTimeLeft(task.dueDate);
        timeBadge.textContent = remaining.label;
        timeBadge.classList.add(`time-${remaining.tone}`);
      } else {
        timeBadge.hidden = true;
      }
    } else {
      dueDate.textContent = "No due date";
      timeBadge.hidden = true;
    }

    editButton.dataset.action = "edit";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    elements.taskList.append(fragment);
  }

  elements.emptyState.hidden = tasks.length > 0;
  elements.emptyState.querySelector("h3").textContent = filter === "active" ? "Your list is clear" : "Nothing completed yet";
  elements.emptyState.querySelector("p").textContent = filter === "active" ? "Tap + to add something new." : "Completed tasks will appear here.";
}

export function updateSummary(tasks, filter) {
  const activeTasks = tasks.filter(task => !task.completed);
  const completed = tasks.length - activeTasks.length;

  elements.activeCount.textContent = activeTasks.length;
  elements.completedCount.textContent = completed;
  elements.clearCompletedButton.disabled = completed === 0;
  elements.boardFooter.hidden = filter !== "completed" || completed === 0;
}

export function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}
