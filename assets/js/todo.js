let tasks = {};

window.onload = function () {
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || []; // ローカルストレージ取得
  savedTasks.forEach((task) => {
    drawTask(task); // それぞれを描画
    tasks[task.id] = task; // tasksに追加
  });

  resetInput();
};


// 新規作成検知
document.getElementById('add').addEventListener('click', createTask); // 追加ボタンが押された場合
document.getElementById('add-text').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') createTask(); // Enterが押下された場合
});


// タスク描画
function drawTask(task) {
  const $taskList = document.getElementById('list');

  // タスクボックスdiv
  const $taskBox = document.createElement('div');
  task.completed
    ? ($taskBox.className = 'task-box completed')
    : ($taskBox.className = 'task-box');

  // テキスト
  const $taskText = document.createElement('label');
  $taskText.textContent = task.text;

  // 完了・未完了チェックボックス
  const $taskCompletedCheck = document.createElement('input');
  $taskCompletedCheck.className = 'task-checkbox';
  $taskCompletedCheck.setAttribute('type', 'checkbox');
  $taskCompletedCheck.checked = task.completed;

  // 完了・未完了トグル
  const toggleCheckbox = () => {
    task = toggleCompleteTask(task);
    task && task.completed
      ? $taskBox.classList.add('completed')
      : $taskBox.classList.remove('completed');
    $taskCompletedCheck.checked = task && task.completed;
  };

  $taskBox.addEventListener('click', toggleCheckbox); // タスクがクリックされた場合
  $taskCompletedCheck.addEventListener('click', toggleCheckbox); // 文字がクリックされた場合
  $taskText.addEventListener('click', toggleCheckbox); // チェックボックスがクリックされた場合

  // 日付
  const $due = document.createElement('p');
  $due.textContent = '期限: ';
  if (task.duedate != '') {
    $due.textContent += task.duedate;
    if (task.duetime != '') $due.textContent += ' ' + task.duetime;
  }
  if (task.duedate == '' && task.duetime != '') $due.textContent += new Date().toLocaleDateString('sv-SE') + ' ' + task.duetime;
  if (task.duedate == '' && task.duetime == '') $due.textContent += 'なし';
  

  // 削除ボタン
  const $deleteButton = document.createElement('button');
  $deleteButton.className = 'delete button border';
  $deleteButton.textContent = '削除';
  $deleteButton.addEventListener('click', () => { 
    deleteTask(task); // タスク削除
    $taskList.removeChild($taskBox); // 要素削除
  });

  // 描画
  $taskText.appendChild($taskCompletedCheck);
  $taskBox.appendChild($taskText);
  $taskBox.appendChild($due);
  $taskBox.appendChild($deleteButton);
  $taskList.appendChild($taskBox);
}


// タスク新規作成
function createTask() {
  const taskText = document.getElementById('add-text').value.trim(); // テキスト取得
  const duedate = document.getElementById('duedate').value;
  const duetime = document.getElementById('duetime').value;
  const id = parseInt(Object.keys(tasks).pop()) + 1 || 0;

  // タスク描画&ローカルストレージに保存
  if (taskText) {
    const task = { id: id, text: taskText, duedate: duedate, duetime: duetime, completed: false };
    tasks[id] = task;

    drawTask(task); // 描画

    // ローカルストレージに保存
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    savedTasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(savedTasks));

    resetInput();
  }
}


// タスク削除
function deleteTask(task) {
  // ローカルストレージから削除
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const updatedTasks = savedTasks.filter((t) => t.id != task.id);
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));

  // tasksから削除
  delete tasks[task.id];
}


// 完了・未完了トグル
function toggleCompleteTask(task) {
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || []; // ローカルストレージ取得
  const taskIndex = savedTasks.findIndex((t) => t.id == task.id);

  if (taskIndex == -1) return; // タスクが見つからなければreturn

  savedTasks[taskIndex].completed = !savedTasks[taskIndex].completed; // 完了・未完了トグル
  localStorage.setItem('tasks', JSON.stringify(savedTasks)); // 保存

  tasks[task.id].completed = !tasks[task.id].completed;

  return tasks[task.id];
}


// 入力フォームリセット
function resetInput() {
  document.getElementById('add-text').value = ''; // タスク入力欄リセット
  document.getElementById('duedate').value = '';
  document.getElementById('duetime').value = '';
}
