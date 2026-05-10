class Task {
  constructor(title, description, dueDate, priority, tags, subtasks = []) {
    this.id = Date.now().toString();
    this.title = title || '無題のタスク';
    this.description = description || '';
    this.dueDate = dueDate || '';
    this.priority = priority || 'medium';
    this.tags = tags || [];
    this.subtasks = subtasks || [];
    this.completed = false;
    this.createdAt = new Date().toISOString();
    this.recurrence = null;
  }
}

const STORAGE_KEY = 'kits_todo_tasks_v2';

// ---- Recurrence helper functions ----

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNthWeekdayOfMonth(year, month, weekday, ord) {
  if (ord === -1) {
    const last = new Date(year, month + 1, 0);
    const diff = (last.getDay() - weekday + 7) % 7;
    last.setDate(last.getDate() - diff);
    return last;
  }
  const first = new Date(year, month, 1);
  const diff = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + diff + (ord - 1) * 7);
}

function getNextDueDate(task) {
  const r = task.recurrence;
  if (!r || r.type === 'none') return null;
  const current = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : new Date();

  switch (r.type) {
    case 'daily': {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return formatDate(next);
    }
    case 'weekly': {
      const days = (r.daysOfWeek || []).map(Number).sort((a, b) => a - b);
      if (days.length === 0) {
        const next = new Date(current);
        next.setDate(next.getDate() + 7);
        return formatDate(next);
      }
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      for (let i = 0; i < 14; i++) {
        if (days.includes(next.getDay())) return formatDate(next);
        next.setDate(next.getDate() + 1);
      }
      return formatDate(next);
    }
    case 'nweekly': {
      const interval = r.interval || 2;
      const days = (r.daysOfWeek || []).map(Number).sort((a, b) => a - b);
      if (days.length === 0) {
        const next = new Date(current);
        next.setDate(next.getDate() + interval * 7);
        return formatDate(next);
      }
      // First check if there is another matching day later in the same week
      for (const day of days) {
        if (day > current.getDay()) {
          const candidate = new Date(current);
          candidate.setDate(current.getDate() + (day - current.getDay()));
          return formatDate(candidate);
        }
      }
      // No more days in this week — jump to the next interval-th week
      const weekSun = new Date(current);
      weekSun.setDate(current.getDate() - current.getDay() + interval * 7);
      for (let i = 0; i < 7; i++) {
        const candidate = new Date(weekSun);
        candidate.setDate(weekSun.getDate() + i);
        if (days.includes(candidate.getDay())) return formatDate(candidate);
      }
      const fallback = new Date(current);
      fallback.setDate(fallback.getDate() + interval * 7);
      return formatDate(fallback);
    }
    case 'monthly-date': {
      const date = r.monthDate || current.getDate();
      const next = new Date(current);
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(date, lastDay));
      return formatDate(next);
    }
    case 'monthly-weekday': {
      const ord = r.monthWeekdayOrd || 1;
      const weekday = r.monthWeekday !== undefined ? Number(r.monthWeekday) : 0;
      const next = new Date(current);
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      return formatDate(getNthWeekdayOfMonth(next.getFullYear(), next.getMonth(), weekday, ord));
    }
  }
  return null;
}

function getRecurrenceLabel(recurrence) {
  if (!recurrence || recurrence.type === 'none') return '';
  const DOW = ['日', '月', '火', '水', '木', '金', '土'];
  switch (recurrence.type) {
    case 'daily': return '毎日';
    case 'weekly': {
      const days = (recurrence.daysOfWeek || []).map(Number).sort((a, b) => a - b);
      return '毎週' + (days.length ? ' ' + days.map(d => DOW[d]).join('') : '');
    }
    case 'nweekly': {
      const interval = recurrence.interval || 2;
      const days = (recurrence.daysOfWeek || []).map(Number).sort((a, b) => a - b);
      const label = interval === 2 ? '隔週' : `${interval}週ごと`;
      return label + (days.length ? ' ' + days.map(d => DOW[d]).join('') : '');
    }
    case 'monthly-date':
      return `毎月${recurrence.monthDate || 1}日`;
    case 'monthly-weekday': {
      const ord = recurrence.monthWeekdayOrd || 1;
      const weekday = recurrence.monthWeekday !== undefined ? Number(recurrence.monthWeekday) : 0;
      const ordLabel = ord === -1 ? '最終' : `第${ord}`;
      return `毎月${ordLabel}${DOW[weekday]}曜`;
    }
  }
  return '';
}

class TodoApp {
  constructor() {
    console.log('TodoApp initializing...');
    this.tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const savedSettings = JSON.parse(localStorage.getItem('todo_settings')) || {};
    this.currentFilter = savedSettings.filter || { status: 'all', sort: 'custom' };
    this.currentView = savedSettings.view || 'list';
    this.currentDate = new Date();
    
    // DOM Elements
    this.listContainer = document.getElementById('todo-list');
    this.calendarContainer = document.getElementById('calendar-grid');
    this.listView = document.getElementById('list-view');
    this.calendarView = document.getElementById('calendar-view');
    this.modal = document.getElementById('task-modal');
    this.form = document.getElementById('task-form');
    this.subtaskListContainer = document.getElementById('subtask-list');
    
    if (this.modal) {
        document.body.appendChild(this.modal);
    }

    if (!this.form) {
        console.error('Task form not found!');
        return;
    }

    this.init();
    console.log('TodoApp initialized with', this.tasks.length, 'tasks');
  }

  init() {
    this.bindEvents();
    
    // Set initial view toggle icon
    const btn = document.getElementById('view-toggle');
    if (btn) {
        btn.innerHTML = this.currentView === 'list' ? '<i class="fa-solid fa-calendar-days"></i>' : '<i class="fa-solid fa-list-ul"></i>';
    }

    this.advanceRecurringTasks();
    this.render();
    this.initSortable();
  }

  bindEvents() {
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.openModal());
    
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    
    if (this.modal) {
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) viewToggle.addEventListener('click', () => this.toggleView());

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', () => this.render());

    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.value = this.currentFilter.status;
      statusFilter.addEventListener('change', (e) => {
        this.currentFilter.status = e.target.value;
        this.save();
        this.render();
      });
    }

    const sortFilter = document.getElementById('filter-sort');
    if (sortFilter) {
      sortFilter.value = this.currentFilter.sort;
      sortFilter.addEventListener('change', (e) => {
        this.currentFilter.sort = e.target.value;
        this.save();
        this.render();
      });
    }

    this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', () => this.addSubtaskInput());

    const newSubtaskInput = document.getElementById('new-subtask-input');
    if (newSubtaskInput) {
        newSubtaskInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                this.addSubtaskInput();
            }
        });
    }

    const prevMonth = document.getElementById('prev-month');
    if (prevMonth) prevMonth.addEventListener('click', () => this.changeMonth(-1));

    const nextMonth = document.getElementById('next-month');
    if (nextMonth) nextMonth.addEventListener('click', () => this.changeMonth(1));

    const recTypeSelect = document.getElementById('task-recurrence-type');
    if (recTypeSelect) recTypeSelect.addEventListener('change', (e) => this.updateRecurrenceUI(e.target.value));

    const endTypeSelect = document.getElementById('task-recurrence-end-type');
    if (endTypeSelect) endTypeSelect.addEventListener('change', (e) => this.updateEndTypeUI(e.target.value));
  }

  initSortable() {
    if (typeof Sortable !== 'undefined' && this.listContainer) {
      this.sortable = new Sortable(this.listContainer, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: (evt) => {
          if(this.currentFilter.status === 'all' && this.currentFilter.sort === 'custom' && !document.getElementById('search-input').value) {
             const movedItem = this.tasks.splice(evt.oldIndex, 1)[0];
             this.tasks.splice(evt.newIndex, 0, movedItem);
             this.save();
          }
        }
      });
    }
  }

  openModal(taskId = null) {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.modal.classList.add('visible');
    this.subtaskListContainer.innerHTML = '';
    document.getElementById('new-subtask-input').value = '';

    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        document.getElementById('modal-title').innerText = 'タスクを編集';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-due').value = task.dueDate || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-tags').value = (task.tags || []).join(', ');
        
        if (task.subtasks) {
          task.subtasks.forEach(st => this.renderSubtaskInput(st.text, st.completed));
        }

        this.populateRecurrenceForm(task.recurrence || null);
      }
    } else {
      document.getElementById('modal-title').innerText = '新しいタスク';
      this.form.reset();
      document.getElementById('task-id').value = '';
      this.populateRecurrenceForm(null);
    }
    
    const titleInput = document.getElementById('task-title');
    if (titleInput) titleInput.focus();
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('visible');
    this.modal.classList.add('hidden');
  }

  renderSubtaskInput(text = '', completed = false) {
      const div = document.createElement('div');
      div.className = 'subtask-row';
      div.innerHTML = `
        <input type="checkbox" class="subtask-check" ${completed ? 'checked' : ''}>
        <input type="text" class="subtask-text-input" value="${escapeHTML(text)}" placeholder="サブタスク...">
        <button type="button" class="btn-icon-subtask" title="削除" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      this.subtaskListContainer.appendChild(div);
  }

  addSubtaskInput() {
      const input = document.getElementById('new-subtask-input');
      const val = input.value.trim();
      if(val) {
          this.renderSubtaskInput(val);
          input.value = '';
          input.focus();
      }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    console.log('Handling form submit...');
    try {
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const due = document.getElementById('task-due').value;
        const priority = document.getElementById('task-priority').value;
        const tagsStr = document.getElementById('task-tags').value;
        const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
        
        const subtaskEls = this.subtaskListContainer.querySelectorAll('.subtask-row');
        const subtasks = Array.from(subtaskEls).map(el => ({
            text: el.querySelector('.subtask-text-input').value,
            completed: el.querySelector('.subtask-check').checked
        })).filter(st => st.text);

        const recurrence = this.getRecurrenceFromForm();

        if (id) {
          const index = this.tasks.findIndex(t => t.id === id);
          if (index !== -1) {
            const existing = this.tasks[index];
            // Preserve completedCount if recurrence type unchanged
            if (recurrence && existing.recurrence && recurrence.type === existing.recurrence.type) {
              recurrence.completedCount = existing.recurrence.completedCount || 0;
            } else if (recurrence) {
              recurrence.completedCount = 0;
            }
            this.tasks[index] = { ...existing, title, description: desc, dueDate: due, priority, tags, subtasks, recurrence };
          }
        } else {
          const newTask = new Task(title, desc, due, priority, tags, subtasks);
          if (recurrence) recurrence.completedCount = 0;
          newTask.recurrence = recurrence;
          this.tasks.push(newTask);
        }

        this.save();
        this.closeModal();
        this.render();
        console.log('Task saved successfully.');
    } catch (err) {
        console.error('Error in handleFormSubmit:', err);
        alert('エラーが発生しました。詳細はコンソールを確認してください。');
    }
  }

  getFilteredTasks() {
    let filtered = [...this.tasks];
    const searchInput = document.getElementById('search-input');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    if (search) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search))));
    }

    if (this.currentFilter.status === 'completed') {
      filtered = filtered.filter(t => t.completed);
    } else if (this.currentFilter.status === 'active') {
      filtered = filtered.filter(t => !t.completed);
    }

    if (this.currentFilter.sort === 'dueDate') {
      filtered.sort((a, b) => {
          if(!a.dueDate) return 1;
          if(!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate)
      });
    } else if (this.currentFilter.sort === 'priority') {
      const pMap = { high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
    }

    return filtered;
  }

  render() {
    if (!this.listContainer || !this.calendarContainer) return;

    if (this.currentView === 'list') {
      this.renderList();
    } else {
      this.renderCalendar();
    }
  }

  renderList() {
    if (this.listView) this.listView.classList.remove('hidden');
    if (this.calendarView) this.calendarView.classList.add('hidden');
    this.listContainer.innerHTML = '';

    const tasks = this.getFilteredTasks();

    const emptyState = document.getElementById('empty-state');
    if (tasks.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      tasks.forEach(task => {
        const el = this.createTaskElement(task);
        this.listContainer.appendChild(el);
      });
    }
    
    const isSortEnabled = this.currentFilter.status === 'all' && 
                          this.currentFilter.sort === 'custom' && 
                          !document.getElementById('search-input').value;
    
    if(this.sortable) {
        this.sortable.option('disabled', !isSortEnabled);
    }
    document.querySelectorAll('.drag-handle').forEach(el => el.style.visibility = isSortEnabled ? 'visible' : 'hidden');
  }

  createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.dataset.id = task.id;

    let dateStr = '';
    let overdueClass = '';
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        // Compare with today (only date part)
        const today = new Date();
        today.setHours(0,0,0,0);
        if(new Date(task.dueDate) < today && !task.completed) overdueClass = 'overdue';
    }

    const totalSub = task.subtasks ? task.subtasks.length : 0;
    const completedSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const subtaskProgress = totalSub > 0 ? `${completedSub}/${totalSub}` : '';

    const priorityLabels = { high: '高', medium: '中', low: '低' };
    const recurrenceLabel = getRecurrenceLabel(task.recurrence);

    div.innerHTML = `
      <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
      <div class="task-content">
        <div class="task-header" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
        </div>
        <p style="font-size:0.9rem; color:var(--text-light); margin:0; white-space: pre-wrap;">${escapeHTML(task.description)}</p>
        
        <div class="task-meta">
            <span class="priority-tag priority-${task.priority}">${priorityLabels[task.priority]}</span>
            ${dateStr ? `<span class="meta-item ${overdueClass}"><i class="fa-regular fa-clock"></i> ${dateStr}</span>` : ''}
            ${recurrenceLabel ? `<span class="meta-item recurrence-badge"><i class="fa-solid fa-repeat"></i> ${escapeHTML(recurrenceLabel)}</span>` : ''}
            ${(task.tags || []).map(t => `<span class="tag-badge">#${escapeHTML(t)}</span>`).join('')}
            ${subtaskProgress ? `<span class="meta-item"><i class="fa-solid fa-list-check"></i> ${subtaskProgress}</span>` : ''}
        </div>

        ${totalSub > 0 ? `
        <div class="subtasks-preview">
            ${task.subtasks.map((st, index) => `
                <div class="subtask-preview-item ${st.completed ? 'done' : ''}" data-index="${index}">
                    <i class="${st.completed ? 'fa-solid' : 'far'} ${st.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span class="subtask-preview-text">${escapeHTML(st.text)}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
      </div>
      <div class="task-actions">
        <button class="edit-btn" title="編集"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn" title="削除"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    div.querySelector('.task-checkbox').addEventListener('click', (e) => e.stopPropagation());
    div.querySelector('.task-checkbox').addEventListener('change', () => this.toggleComplete(task.id));
    div.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); this.openModal(task.id); });
    div.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); this.deleteTask(task.id); });
    
    // Subtask toggle inside preview
    const subtaskPreview = div.querySelector('.subtasks-preview');
    if (subtaskPreview) {
        subtaskPreview.querySelectorAll('.subtask-preview-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.toggleSubtaskComplete(task.id, index);
            });
        });
    }

    div.querySelector('.task-content').addEventListener('click', (e) => {
        if (!e.target.closest('.subtask-preview-item')) {
            this.openModal(task.id);
        }
    });

    return div;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      this.render();
    }
  }

  toggleSubtaskComplete(taskId, subtaskIndex) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
        task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
        this.save();
        this.render();
    }
  }

  deleteTask(id) {
    if (confirm('このタスクを削除してもよろしいですか？')) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.save();
      this.render();
    }
  }

  advanceRecurringTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let changed = false;

    this.tasks.forEach(task => {
      const r = task.recurrence;
      if (!r || r.type === 'none' || !task.dueDate) return;

      // If recurrence count limit already reached, don't advance
      if (r.endType === 'count' && (r.completedCount || 0) >= (r.endCount || 1)) return;

      if (new Date(task.dueDate + 'T00:00:00') >= today) return;

      let currentDue = task.dueDate;
      let completedCount = r.completedCount || 0;
      let firstPass = true;
      const wasCompleted = task.completed;

      while (new Date(currentDue + 'T00:00:00') < today) {
        // Increment count only for the originally-completed occurrence
        if (firstPass && wasCompleted) {
          completedCount++;
          if (r.endType === 'count' && completedCount >= (r.endCount || 1)) {
            // Last occurrence completed — just update count, keep completed
            task.recurrence = { ...r, completedCount };
            changed = true;
            return;
          }
        }
        firstPass = false;

        const nextDue = getNextDueDate({ ...task, dueDate: currentDue });
        if (!nextDue) return;

        if (r.endType === 'date' && r.endDate && nextDue > r.endDate) {
          // Next occurrence would exceed end date — update count if needed
          if (wasCompleted && completedCount !== (r.completedCount || 0)) {
            task.recurrence = { ...r, completedCount };
            changed = true;
          }
          return;
        }

        currentDue = nextDue;
      }

      if (currentDue !== task.dueDate || completedCount !== (r.completedCount || 0)) {
        task.dueDate = currentDue;
        task.completed = false;
        task.recurrence = { ...r, completedCount };
        changed = true;
      }
    });

    if (changed) this.save();
  }

  getRecurrenceFromForm() {
    const type = document.getElementById('task-recurrence-type').value;
    if (type === 'none') return null;

    const r = { type };

    if (type === 'weekly' || type === 'nweekly') {
      r.daysOfWeek = Array.from(document.querySelectorAll('input[name="recurrence-dow"]:checked'))
        .map(el => Number(el.value));
    }

    if (type === 'nweekly') {
      r.interval = parseInt(document.getElementById('task-recurrence-interval').value) || 2;
    }

    if (type === 'monthly-date') {
      r.monthDate = parseInt(document.getElementById('task-recurrence-month-date').value) || 1;
    }

    if (type === 'monthly-weekday') {
      r.monthWeekdayOrd = parseInt(document.getElementById('task-recurrence-month-ord').value) || 1;
      r.monthWeekday = parseInt(document.getElementById('task-recurrence-month-weekday').value) || 0;
    }

    const endType = document.getElementById('task-recurrence-end-type').value;
    r.endType = endType;

    if (endType === 'date') {
      r.endDate = document.getElementById('task-recurrence-end-date').value;
    } else if (endType === 'count') {
      r.endCount = parseInt(document.getElementById('task-recurrence-end-count').value) || 10;
    }

    return r;
  }

  populateRecurrenceForm(recurrence) {
    const type = (recurrence && recurrence.type) || 'none';
    document.getElementById('task-recurrence-type').value = type;
    this.updateRecurrenceUI(type);

    if (recurrence) {
      if (type === 'weekly' || type === 'nweekly') {
        const dows = (recurrence.daysOfWeek || []).map(Number);
        document.querySelectorAll('input[name="recurrence-dow"]').forEach(cb => {
          cb.checked = dows.includes(Number(cb.value));
        });
      }

      if (type === 'nweekly') {
        document.getElementById('task-recurrence-interval').value = recurrence.interval || 2;
      }

      if (type === 'monthly-date') {
        document.getElementById('task-recurrence-month-date').value = recurrence.monthDate || 1;
      }

      if (type === 'monthly-weekday') {
        document.getElementById('task-recurrence-month-ord').value = recurrence.monthWeekdayOrd || 1;
        document.getElementById('task-recurrence-month-weekday').value = recurrence.monthWeekday || 0;
      }

      const endType = recurrence.endType || 'never';
      document.getElementById('task-recurrence-end-type').value = endType;
      this.updateEndTypeUI(endType);

      if (endType === 'date' && recurrence.endDate) {
        document.getElementById('task-recurrence-end-date').value = recurrence.endDate;
      } else if (endType === 'count' && recurrence.endCount) {
        document.getElementById('task-recurrence-end-count').value = recurrence.endCount;
      }
    } else {
      // Reset all recurrence fields
      document.querySelectorAll('input[name="recurrence-dow"]').forEach(cb => { cb.checked = false; });
      document.getElementById('task-recurrence-interval').value = 2;
      document.getElementById('task-recurrence-month-date').value = 1;
      document.getElementById('task-recurrence-month-ord').value = 1;
      document.getElementById('task-recurrence-month-weekday').value = 0;
      document.getElementById('task-recurrence-end-type').value = 'never';
      this.updateEndTypeUI('never');
    }
  }

  updateRecurrenceUI(type) {
    const showDays = type === 'weekly' || type === 'nweekly';
    document.getElementById('recurrence-days-row').classList.toggle('hidden', !showDays);
    document.getElementById('recurrence-interval-row').classList.toggle('hidden', type !== 'nweekly');
    document.getElementById('recurrence-month-date-row').classList.toggle('hidden', type !== 'monthly-date');
    document.getElementById('recurrence-month-weekday-row').classList.toggle('hidden', type !== 'monthly-weekday');
    document.getElementById('recurrence-end-row').classList.toggle('hidden', type === 'none');
  }

  updateEndTypeUI(endType) {
    document.getElementById('recurrence-end-date-row').classList.toggle('hidden', endType !== 'date');
    document.getElementById('recurrence-end-count-row').classList.toggle('hidden', endType !== 'count');
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    localStorage.setItem('todo_settings', JSON.stringify({
      view: this.currentView,
      filter: this.currentFilter
    }));
  }

  toggleView() {
    this.currentView = this.currentView === 'list' ? 'calendar' : 'list';
    this.save();
    this.render();
    const btn = document.getElementById('view-toggle');
    if (btn) {
        btn.innerHTML = this.currentView === 'list' ? '<i class="fa-solid fa-calendar-days"></i>' : '<i class="fa-solid fa-list-ul"></i>';
    }
  }

  getRecurringOccurrencesInMonth(task, year, month) {
    const r = task.recurrence;
    if (!r || r.type === 'none' || !task.dueDate) return [];

    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayStr = formatDate(new Date(year, month + 1, 0));
    const countEnded = r.endType === 'count' && (r.completedCount || 0) >= (r.endCount || 1);

    const occurrences = [];
    let currentDue = task.dueDate;
    let iterations = 0;

    // Advance past dates before the start of the month
    while (currentDue < firstDayStr && iterations < 500) {
      iterations++;
      if (countEnded) return occurrences;
      if (r.endType === 'date' && r.endDate && currentDue > r.endDate) return occurrences;
      const next = getNextDueDate({ ...task, dueDate: currentDue });
      if (!next || next <= currentDue) return occurrences;
      currentDue = next;
    }

    // Collect occurrences within the month
    while (currentDue <= lastDayStr && iterations < 1000) {
      iterations++;
      if (r.endType === 'date' && r.endDate && currentDue > r.endDate) break;
      occurrences.push(currentDue);
      if (countEnded) break;
      const next = getNextDueDate({ ...task, dueDate: currentDue });
      if (!next || next <= currentDue) break;
      currentDue = next;
    }

    return occurrences;
  }

  renderCalendar() {
    if (this.listView) this.listView.classList.add('hidden');
    if (this.calendarView) this.calendarView.classList.remove('hidden');
    this.calendarContainer.innerHTML = '';
    
    document.getElementById('current-month-display').innerText = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Pre-compute recurring task occurrences for this month
    const recurringByDate = {};
    this.tasks.forEach(task => {
      if (task.recurrence && task.recurrence.type !== 'none') {
        const dates = this.getRecurringOccurrencesInMonth(task, year, month);
        dates.forEach(dateStr => {
          if (!recurringByDate[dateStr]) recurringByDate[dateStr] = [];
          recurringByDate[dateStr].push(task);
        });
      }
    });

    for(let i=0; i<firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        this.calendarContainer.appendChild(div);
    }

    for(let i=1; i<=daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const today = new Date();
        if(i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }

        div.innerHTML = `<div class="day-number">${i}</div>`;
        
        // Non-recurring tasks matched by dueDate + recurring task occurrences for this day
        const nonRecurring = this.tasks.filter(t =>
          t.dueDate && t.dueDate.startsWith(dateStr) && (!t.recurrence || t.recurrence.type === 'none')
        );
        const dayTasks = [...nonRecurring, ...(recurringByDate[dateStr] || [])];
        dayTasks.forEach(t => {
            const taskDiv = document.createElement('div');
            // Future occurrences (not the current dueDate) are shown as uncompleted
            const isCompleted = t.dueDate === dateStr ? t.completed : false;
            taskDiv.className = `day-task ${isCompleted ? 'completed' : ''} priority-${t.priority}`;
            taskDiv.innerText = t.title;
            const recLabel = getRecurrenceLabel(t.recurrence);
            taskDiv.title = recLabel ? `${t.title} (${recLabel})` : t.title;
            taskDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(t.id);
            });
            div.appendChild(taskDiv);
        });

        div.addEventListener('click', () => {
             this.openModal();
             document.getElementById('task-due').value = dateStr;
        });

        this.calendarContainer.appendChild(div);
    }
  }

  changeMonth(delta) {
      // Set to 1st of month to avoid issues with shorter months (e.g. Jan 31 -> Feb 31 rolls to March)
      this.currentDate.setDate(1);
      this.currentDate.setMonth(this.currentDate.getMonth() + delta);
      this.render();
  }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function startApp() {
    if (window.todoApp) return;
    window.todoApp = new TodoApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
