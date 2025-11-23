// ページ読み込み時ローカルストレージからタスク取得
window.onload = function () {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || []; // ローカルストレージ取得
  savedTasks.forEach((t) => drawTask(t)); // それぞれを描画
};

// タスク描画処理
function drawTask(task) {
  const $taskList = document.getElementById("list"); // タスクリスト取得

  // タスクdiv
  const $taskBox = document.createElement("div");
  task.completed
    ? ($taskBox.className = "task-box completed")
    : ($taskBox.className = "task-box");

  // テキスト
  const $taskText = document.createElement("label");
  $taskText.textContent = task.text;

  // 完了・未完了チェックボックス
  const $taskCompletedCheck = document.createElement("input");
  $taskCompletedCheck.className = "task-checkbox";
  $taskCompletedCheck.setAttribute("type", "checkbox");
  $taskCompletedCheck.checked = task.completed;

  // 完了・未完了切り替え処理
  const toggleCheckbox = () => {
    task = toggleCompleteTask(task);
    task && task.completed
      ? $taskBox.classList.add("completed")
      : $taskBox.classList.remove("completed");
    $taskCompletedCheck.checked = task && task.completed;
  };

  $taskBox.addEventListener("click", toggleCheckbox); // タスクがクリックされた場合
  $taskCompletedCheck.addEventListener("click", toggleCheckbox); // 文字がクリックされた場合
  $taskText.addEventListener("click", toggleCheckbox); // チェックボックスがクリックされた場合

  // 削除ボタン
  const $deleteButton = document.createElement("button");
  $deleteButton.className = "delete button border";
  $deleteButton.textContent = "削除";
  $deleteButton.addEventListener("click", () => {
    deleteTask(task);
    $taskList.removeChild($taskBox);
  }); // 削除

  // 描画
  $taskText.appendChild($taskCompletedCheck);
  $taskBox.appendChild($taskText);
  $taskBox.appendChild($deleteButton);
  $taskList.appendChild($taskBox);
}

// 新規作成検知
document.getElementById("add").addEventListener("click", makeTask); // 追加ボタンが押された場合
document.getElementById("add-text").addEventListener("keypress", (e) => {
  if (e.key === "Enter") makeTask();
}); // Enterが押下された場合

// タスク新規作成処理
function makeTask() {
  const taskText = document.getElementById("add-text").value.trim(); // テキスト取得

  // タスク描画&ローカルストレージに保存
  if (taskText) {
    const task = { text: taskText, completed: false };

    drawTask(task); // 描画

    // ローカルストレージに反映
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    savedTasks.push({ text: taskText, completed: false });
    localStorage.setItem("tasks", JSON.stringify(savedTasks));

    document.getElementById("add-text").value = ""; // 入力欄リセット
  }
}

// タスク削除処理
function deleteTask(task) {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || []; // ローカルストレージ取得
  const updatedTasks = savedTasks.filter((t) => t.text != task.text); // 指定のタスクを除いたリスト

  localStorage.setItem("tasks", JSON.stringify(updatedTasks)); // 反映
}

// タスクローカルストレージ更新処理
function toggleCompleteTask(task) {
  // ローカルストレージ取得
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const taskId = savedTasks.findIndex((t) => t.text == task.text);

  if (taskId == -1) return; // ローカルストレージにタスクが見つからなければreturn

  savedTasks[taskId].completed = !savedTasks[taskId].completed; // 切り替え
  localStorage.setItem("tasks", JSON.stringify(savedTasks)); // 反映

  return savedTasks[taskId]; // 切り替え済みタスク返却
}
