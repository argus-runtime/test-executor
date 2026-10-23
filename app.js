'use strict';

const STORAGE_KEY = 'test-executor.tasks.v1';
const $ = (selector) => document.querySelector(selector);
let tasks = [];
let filter = 'all';
let editingId = null;
let storageHealthy = true;

function storageWarning(message) {
  storageHealthy = false;
  $('.local-label').textContent = 'Changes are not saved';
  $('#storage-warning').textContent = message;
  $('#storage-warning').hidden = false;
}

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw === null ? [] : JSON.parse(raw);
  const ids = new Set();
  if (!Array.isArray(saved) || !saved.every((task) => {
    if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.text !== 'string' || !task.text.trim() || task.text.length > 300 || typeof task.completed !== 'boolean') return false;
    ids.add(task.id);
    return true;
  })) throw new Error('Invalid saved tasks');
  tasks = saved;
} catch {
  storageWarning('Saved tasks could not be loaded. You can use this list for now, but changes will not be saved. Browser storage has been left untouched.');
}

function persist() {
  if (!storageHealthy) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch { storageWarning('Your browser could not save these changes. Keep this tab open to keep your current list.'); }
}

function announce(message) { $('#announcement').textContent = message; }
function commit(message) { persist(); render(); announce(message); }

const icons = {
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5"/></svg>',
  delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7"/></svg>'
};

function actionButton(kind, task, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `icon-button ${kind}-button`;
  button.setAttribute('aria-label', `${kind === 'edit' ? 'Edit' : 'Delete'} task: ${task.text}`);
  button.title = kind === 'edit' ? 'Edit task' : 'Delete task';
  button.innerHTML = icons[kind]; // Only fixed SVG markup; task text is never HTML.
  button.addEventListener('click', callback);
  return button;
}

function returnToTask(id) {
  const index = tasks.filter(matchesFilter).findIndex((task) => task.id === id);
  const row = $('#task-list').children[index];
  (row?.querySelector('.edit-button') || $('#task-input')).focus();
}

function editForm(task) {
  const form = document.createElement('form');
  form.className = 'edit-form';
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = task.text;
  input.maxLength = 300;
  input.required = true;
  input.setAttribute('aria-label', 'Edit task text');
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  function close() { editingId = null; render(); returnToTask(task.id); }
  cancel.addEventListener('click', close);
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  input.addEventListener('input', () => input.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) { input.setCustomValidity('Enter a task before saving.'); input.reportValidity(); return; }
    task.text = text;
    editingId = null;
    commit('Task updated.');
    returnToTask(task.id);
  });
  form.append(input, save, cancel);
  return form;
}

function matchesFilter(task) { return filter === 'all' || (filter === 'completed' ? task.completed : !task.completed); }

function render() {
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = tasks.length - completed;
  $('#total-count').textContent = tasks.length;
  $('#remaining-count').textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
  $('#progress-label').textContent = tasks.length ? `${completed} of ${tasks.length} complete` : 'A fresh start';
  $('#progress-fill').style.width = `${tasks.length ? completed / tasks.length * 100 : 0}%`;
  $('#clear-completed').disabled = completed === 0;
  document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  const list = $('#task-list');
  list.replaceChildren();
  const visible = tasks.filter(matchesFilter);
  visible.forEach((task, index) => {
    const row = document.createElement('li');
    row.className = `task${task.completed ? ' completed' : ''}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `task-${index}`;
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.completed ? 'active' : 'complete'}`);
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      commit(task.completed ? 'Task completed.' : 'Task marked active.');
      const next = list.children[Math.min(index, list.children.length - 1)];
      (next?.querySelector('input[type="checkbox"]') || $('#task-input')).focus();
    });
    row.append(checkbox);
    if (editingId === task.id) {
      row.append(editForm(task));
    } else {
      const label = document.createElement('label');
      label.className = 'task-label';
      label.htmlFor = checkbox.id;
      label.textContent = task.text;
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      actions.append(actionButton('edit', task, () => { editingId = task.id; render(); $('.edit-input').focus(); $('.edit-input').select(); }), actionButton('delete', task, () => {
        tasks = tasks.filter((item) => item.id !== task.id);
        commit('Task deleted.');
        const next = list.children[Math.min(index, list.children.length - 1)];
        (next?.querySelector('.delete-button') || $('#task-input')).focus();
      }));
      row.append(label, actions);
    }
    list.append(row);
  });
  $('#empty-state').hidden = visible.length > 0;
  const emptyCopy = filter === 'completed' ? ['No completed tasks yet.', 'Your small wins will show up here.'] : filter === 'active' && tasks.length ? ['All caught up.', 'Take a breath. You have earned it.'] : ['Your day, a blank canvas.', 'Add your first task above. Small steps count.'];
  $('#empty-title').textContent = emptyCopy[0];
  $('#empty-description').textContent = emptyCopy[1];
}

$('#today').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
$('#task-input').addEventListener('input', () => $('#task-input').setCustomValidity(''));
$('#add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#task-input');
  const text = input.value.trim();
  if (!text) { input.setCustomValidity('Enter a task to get started.'); input.reportValidity(); return; }
  tasks.push({ id: crypto.randomUUID(), text, completed: false });
  filter = filter === 'completed' ? 'active' : filter;
  editingId = null;
  input.value = '';
  commit('Task added.');
  input.focus();
});
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { filter = button.dataset.filter; editingId = null; render(); }));
$('#clear-completed').addEventListener('click', () => { tasks = tasks.filter((task) => !task.completed); editingId = null; commit('Completed tasks cleared.'); $('[data-filter="' + filter + '"]').focus(); });
render();
