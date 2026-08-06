const STORAGE_KEY = "focus-todo.tasks.v1";

function normaliseTask(task) {
  const now = new Date().toISOString();

  return {
    id: String(task.id ?? crypto.randomUUID()),
    title: String(task.title ?? "").trim(),
    description: String(task.description ?? "").trim(),
    completed: Boolean(task.completed),
    priority: ["low", "medium", "high"].includes(task.priority)
      ? task.priority
      : "medium",
    dueDate: String(task.dueDate ?? ""),
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now
  };
}

export function loadTasks() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .map(normaliseTask)
      .filter(task => task.title.length > 0);
  } catch (error) {
    console.error("Unable to load tasks:", error);
    return [];
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Unable to save tasks:", error);
    return false;
  }
}
