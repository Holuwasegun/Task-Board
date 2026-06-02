const STORAGE_KEY = 'taskDashboardState';
const PAGE_ACCESS_KEY = 'pageAccessCount';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return [];
}

function saveState(ts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
  } catch (_) { }
}

let tasks = loadState().map(t => ({
  ...t,
  taskDate: t.taskDate || toLocalDate(t.dateCreated),
  isRepetitive: t.isRepetitive || false,
}));

let selectedTaskId = null;
let currentTab = 'pending';
let formExpanded = false;
let selectedDate = getTodayDate();
let editingTaskId = null;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toLocalDate(iso) {
  const d = new Date(iso);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function getTodayDate() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function getFilteredTasks() {
  return tasks.filter(t =>
    t.status === currentTab &&
    (t.taskDate === selectedDate || t.isRepetitive)
  );
}

function render() {
  renderCounter();
  renderTaskList();
  renderBadges();
  renderSidebarMetrics();
}

function renderCounter() {
  const el = document.getElementById('pendingCount');
  const count = tasks.filter(t => t.status === 'pending').length;
  const prev = parseInt(el.textContent, 10);
  el.textContent = count;
  if (count !== prev) {
    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
    setTimeout(() => el.classList.remove('flip'), 300);
  }
}

function renderTaskList() {
  const container = document.getElementById('taskList');
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-list">
        <div class="icon">&#128203;</div>
        <p>No ${currentTab} tasks for this day</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const isSelected = task.id === selectedTaskId && task.status === 'pending';
    const notes = task.notes || '';
    return `
      <div class="task-item${task.status === 'completed' ? ' completed' : ''}"
           data-id="${task.id}">
        <div class="task-check${task.status === 'completed' ? ' checked' : ' pending-dot'}"
             data-toggle-id="${task.id}"
             role="checkbox"
             aria-checked="${task.status === 'completed'}"
             tabindex="0"
             title="Toggle status"></div>

        <div class="task-body" data-select-id="${task.id}">
          <div class="title">
            ${escapeHtml(task.title)}
            ${task.isRepetitive ? '<span class="rep-badge" title="Daily repetitive task">&#128259;</span>' : ''}
          </div>
          ${task.description ? `<div class="desc-preview">${escapeHtml(task.description)}</div>` : ''}
          <div class="meta">
            <span>${formatDate(task.dateCreated)}</span>
            ${task.isRepetitive ? '<span class="rep-meta">&#128259; Repeats daily</span>' : ''}
            ${notes ? '<span>&#128221; has notes</span>' : ''}
          </div>
        </div>

        <button class="task-edit" data-edit-id="${task.id}" title="Edit task">&#9998;</button>
        <button class="task-del" data-del-id="${task.id}" title="Delete task">&times;</button>
      </div>
      ${task.status === 'pending' ? `
      <div class="task-notes-expand${isSelected ? ' open' : ''}" data-notes-id="${task.id}">
        <textarea rows="2" placeholder="Quick inline notes…" data-inline-notes="${task.id}">${escapeHtml(notes)}</textarea>
      </div>` : ''}
    `;
  }).join('');
}

function renderBadges() {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('completedBadge').textContent = completed;
}

function renderSidebarMetrics() {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  document.getElementById('metricPending').textContent = pending;
  document.getElementById('metricCompleted').textContent = completed;
  document.getElementById('metricTotal').textContent = total;
  document.getElementById('metricCompletion').textContent =
    total === 0 ? '0%' : Math.round((completed / total) * 100) + '%';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function selectTaskForNotes(taskId) {
  if (selectedTaskId === taskId) { deselectNotes(); return; }
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'pending') return;
  selectedTaskId = taskId;
  updateNotesPanel(task);
  renderTaskList();
}

function deselectNotes() {
  selectedTaskId = null;
  document.getElementById('notesEmpty').style.display = 'flex';
  document.getElementById('notesActive').style.display = 'none';
  document.getElementById('notesContextLabel').textContent = '';
  renderTaskList();
}

function updateNotesPanel(task) {
  document.getElementById('notesEmpty').style.display = 'none';
  const active = document.getElementById('notesActive');
  active.style.display = 'flex';
  document.getElementById('selectedTaskTitle').textContent = task.title;
  document.getElementById('notesTextarea').value = task.notes || '';
  document.getElementById('notesContextLabel').textContent = `— created ${formatDate(task.dateCreated)}`;
  document.getElementById('saveNotesBtn').disabled = true;
}

function addTask(title, description, notes, isRepetitive) {
  const task = {
    id: uid(),
    title: title.trim(),
    description: (description || '').trim(),
    status: 'pending',
    dateCreated: new Date().toISOString(),
    taskDate: selectedDate,
    notes: (notes || '').trim(),
    isRepetitive: !!isRepetitive,
  };
  tasks.push(task);
  saveState(tasks);
  currentTab = 'pending';
  updateTabUI();
  if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) deselectNotes();
  render();
  clearForm();
}

function toggleTaskStatus(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = task.status === 'pending' ? 'completed' : 'pending';
  if (task.status === 'completed' && selectedTaskId === taskId) deselectNotes();
  saveState(tasks);
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  if (selectedTaskId === taskId) deselectNotes();
  saveState(tasks);
  render();
}

function saveNotes(taskId, notes) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.notes = notes.trim();
  saveState(tasks);
  renderTaskList();
  document.getElementById('saveNotesBtn').disabled = true;
}

function clearSelectedNotes() {
  if (!selectedTaskId) return;
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return;
  task.notes = '';
  saveState(tasks);
  document.getElementById('notesTextarea').value = '';
  document.getElementById('saveNotesBtn').disabled = true;
  renderTaskList();
}

function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  editingTaskId = taskId;
  document.getElementById('editTitleInput').value = task.title;
  document.getElementById('editDescInput').value = task.description || '';
  document.getElementById('editNotesInput').value = task.notes || '';
  document.getElementById('editModal').style.display = 'flex';
  document.getElementById('editTitleInput').focus();
  document.getElementById('editTitleInput').select();
}

function closeEditModal() {
  editingTaskId = null;
  document.getElementById('editModal').style.display = 'none';
}

function saveEdit() {
  if (!editingTaskId) return;
  const task = tasks.find(t => t.id === editingTaskId);
  if (!task) return;
  const title = document.getElementById('editTitleInput').value.trim();
  if (!title) return;
  task.title = title;
  task.description = document.getElementById('editDescInput').value.trim();
  task.notes = document.getElementById('editNotesInput').value.trim();
  saveState(tasks);
  closeEditModal();
  render();
}

function clearForm() {
  document.getElementById('taskTitleInput').value = '';
  document.getElementById('taskDescInput').value = '';
  document.getElementById('taskNotesInput').value = '';
  document.getElementById('repetitiveCheck').checked = false;
  document.getElementById('taskTitleInput').focus();
}

function toggleFormExpand() {
  formExpanded = !formExpanded;
  document.getElementById('formExpand').classList.toggle('open', formExpanded);
  document.getElementById('expandArrow').classList.toggle('open', formExpanded);
  const toggle = document.getElementById('expandToggle');
  toggle.innerHTML = '<span class="arrow' + (formExpanded ? ' open' : '') + '" id="expandArrow">&#9660;</span> '
    + (formExpanded ? 'Hide details' : 'Add details');
}

function updateTabUI() {
  document.querySelectorAll('.tabs button').forEach(btn => {
    const isActive = btn.dataset.tab === currentTab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
}

function getPageAccessCount() {
  try {
    const raw = localStorage.getItem(PAGE_ACCESS_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch (_) {
    return 0;
  }
}

function incrementPageAccessCount() {
  const count = getPageAccessCount() + 1;
  try {
    localStorage.setItem(PAGE_ACCESS_KEY, count.toString());
  } catch (_) { }
  const el = document.getElementById('pageAccessCount');
  if (el) el.textContent = count;
}

document.addEventListener('DOMContentLoaded', function () {
  incrementPageAccessCount();
  const dayPicker = document.getElementById('selectedDate');
  dayPicker.value = selectedDate;
  dayPicker.addEventListener('change', function () {
    selectedDate = this.value || getTodayDate();
    this.value = selectedDate;
    renderTaskList();
  });

  document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('taskTitleInput').value.trim();
    if (!title) return;
    addTask(title,
      document.getElementById('taskDescInput').value,
      document.getElementById('taskNotesInput').value,
      document.getElementById('repetitiveCheck').checked);
  });

  document.getElementById('expandToggle').addEventListener('click', toggleFormExpand);

  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', function () {
      currentTab = this.dataset.tab;
      updateTabUI();
      renderTaskList();
      renderBadges();
    });
  });

  document.getElementById('taskList').addEventListener('click', function (e) {
    const editEl = e.target.closest('[data-edit-id]');
    if (editEl) { e.stopPropagation(); openEditModal(editEl.dataset.editId); return; }

    const toggleEl = e.target.closest('[data-toggle-id]');
    if (toggleEl) { e.stopPropagation(); toggleTaskStatus(toggleEl.dataset.toggleId); return; }

    const delEl = e.target.closest('[data-del-id]');
    if (delEl) { e.stopPropagation(); deleteTask(delEl.dataset.delId); return; }

    const selectEl = e.target.closest('[data-select-id]');
    if (selectEl) {
      const parent = selectEl.closest('.task-item');
      if (parent && !parent.classList.contains('completed')) selectTaskForNotes(selectEl.dataset.selectId);
    }
  });

  document.getElementById('taskList').addEventListener('keydown', function (e) {
    const toggleEl = e.target.closest('[data-toggle-id]');
    if (toggleEl && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleTaskStatus(toggleEl.dataset.toggleId);
    }
  });

  document.getElementById('taskList').addEventListener('blur', function (e) {
    const ta = e.target.closest('[data-inline-notes]');
    if (ta) {
      const taskId = ta.dataset.inlineNotes;
      saveNotes(taskId, ta.value);
      if (selectedTaskId === taskId) document.getElementById('notesTextarea').value = ta.value;
    }
  }, true);

  document.getElementById('saveNotesBtn').addEventListener('click', function () {
    if (!selectedTaskId) return;
    const notes = document.getElementById('notesTextarea').value;
    saveNotes(selectedTaskId, notes);
    const inlineTa = document.querySelector(`[data-inline-notes="${selectedTaskId}"]`);
    if (inlineTa) inlineTa.value = notes;
  });

  document.getElementById('notesTextarea').addEventListener('input', function () {
    if (!selectedTaskId) return;
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    document.getElementById('saveNotesBtn').disabled = (this.value === (task.notes || ''));
  });

  document.getElementById('clearNotesBtn').addEventListener('click', clearSelectedNotes);
  document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
  document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
  document.getElementById('editCloseBtn').addEventListener('click', closeEditModal);

  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });

  document.getElementById('editTitleInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
  });

  document.addEventListener('keydown', function (e) {
    if (editingTaskId && e.key === 'Escape') { closeEditModal(); return; }
    if (e.key === 'Escape' && selectedTaskId) deselectNotes();
  });

  render();
  updateTabUI();
});
