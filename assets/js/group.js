document.getElementById("divideButton").addEventListener("click", function () {
  var names = document.getElementById("names").value.split(",");
  var numGroups = document.getElementById("numGroups").value;
  var result = divideIntoGroups(names, numGroups);
  document.getElementById("result").innerHTML = result;
  localStorage.setItem("names", document.getElementById("names").value);
  localStorage.setItem(
    "numGroups",
    document.getElementById("numGroups").value
  );
  localStorage.setItem("result", result);
  applyFooterPosition();
});
window.onload = function () {
  var result = localStorage.getItem("result");
  var names = localStorage.getItem("names");
  var numGroups = localStorage.getItem("numGroups");
  // ページの再読み込み時に名前とグループ数も復元
  if (result) {
    document.getElementById("result").innerHTML = result;
  }
  if (names) {
    document.getElementById("names").value = names;
  }
  if (numGroups) {
    document.getElementById("numGroups").value = numGroups;
  }
  applyFooterPosition();
};
function divideIntoGroups(names, numGroups) {
  // ここで名前をグループに分けるロジックを実装します。
  // 名前をランダムにシャッフルしてから、均等にグループに分けます。
  shuffleArray(names);
  var groups = [];
  for (var i = 0; i < names.length; i++) {
    var groupIndex = i % numGroups;
    if (!groups[groupIndex]) {
      groups[groupIndex] = [];
    }
    groups[groupIndex].push(names[i]);
  }
  var result = "";
  for (var i = 0; i < groups.length; i++) {
    result += "グループ " + (i + 1) + ": " + groups[i].join(", ") + "<br>";
  }
  return result;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// divideIntoGroups関数とshuffleArray関数は以前と同じです。

function applyFooterPosition() {
  const $footer = document.getElementsByTagName('footer')[0];
  if (document.documentElement.scrollHeight > window.innerHeight) $footer.style.position = 'static';
  else $footer.style.position = 'fixed';
}

document
  .getElementById("autofillButton")
  .addEventListener("click", function () {
    const numOfPeople = parseInt(
      document.getElementById("numberOfPeople").value
    );
    People = Array.from({ length: numOfPeople }, (v, i) => i + 1);
    document.getElementById("names").value = People.join(",");
  });
