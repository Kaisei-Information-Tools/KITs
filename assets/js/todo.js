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
  }
}

const STORAGE_KEY = 'kits_todo_tasks_v2';

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

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportTasks());

    const importBtn = document.getElementById('import-btn');
    if (importBtn) importBtn.addEventListener('click', () => this.triggerImport());

    const importFileInput = document.getElementById('import-file-input');
    if (importFileInput) importFileInput.addEventListener('change', (e) => this.importTasks(e));
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

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
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
      }
    } else {
      document.getElementById('modal-title').innerText = '新しいタスク';
      this.form.reset();
      document.getElementById('task-id').value = '';
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

        if (id) {
          const index = this.tasks.findIndex(t => t.id === id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], title, description: desc, dueDate: due, priority, tags, subtasks };
          }
        } else {
          const newTask = new Task(title, desc, due, priority, tags, subtasks);
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

  renderCalendar() {
    if (this.listView) this.listView.classList.add('hidden');
    if (this.calendarView) this.calendarView.classList.remove('hidden');
    this.calendarContainer.innerHTML = '';
    
    document.getElementById('current-month-display').innerText = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

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
        
        const dayTasks = this.tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
        dayTasks.forEach(t => {
            const taskDiv = document.createElement('div');
            taskDiv.className = `day-task ${t.completed ? 'completed' : ''} priority-${t.priority}`;
            taskDiv.innerText = t.title;
            taskDiv.title = t.title;
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

  exportTasks() {
    try {
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        tasks: this.tasks
      };
      
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `todo-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showNotification('タスクをエクスポートしました', 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('エクスポートに失敗しました', 'error');
    }
  }

  triggerImport() {
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
      fileInput.click();
    }
  }

  importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the JSON structure
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid JSON structure: tasks array not found');
        }

        // Confirm before overwriting
        const confirmMsg = `現在のタスク (${this.tasks.length}個) をインポートしたタスク (${data.tasks.length}個) で上書きしますか？`;
        if (!confirm(confirmMsg)) {
          event.target.value = ''; // Reset file input
          return;
        }

        // Import the tasks
        this.tasks = data.tasks;
        this.save();
        this.render();
        
        this.showNotification(`${data.tasks.length}個のタスクをインポートしました`, 'success');
        event.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification('インポートに失敗しました: ' + error.message, 'error');
        event.target.value = ''; // Reset file input
      }
    };

    reader.onerror = () => {
      this.showNotification('ファイルの読み込みに失敗しました', 'error');
      event.target.value = ''; // Reset file input
    };

    reader.readAsText(file);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
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
