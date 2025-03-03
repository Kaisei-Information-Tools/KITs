function analyzeText() {
  let text = document.getElementById("textInput").value;
  let segmenter = new TinySegmenter();

  let words = text.split(/\r?\n/).flatMap((line) => segmenter.segment(line));
  words = words.filter((word) => word.trim() !== "");

  let charCount = text.length;
  let charCountNoSpace = text.replace(/\s/g, "").length;
  let wordCount = words.length;
  let lineCount = text.split(/\r?\n/).length;
  let symbolCount = (text.match(/[、。！？…]/g) || []).length;

  let hiragana = (text.match(/[ぁ-ん]/g) || []).length;
  let katakana = (text.match(/[ァ-ン]/g) || []).length;
  let kanji = (text.match(/[一-龥]/g) || []).length;
  let alphabet = (text.match(/[a-zA-Z]/g) || []).length;
  let total = charCount || 1;
  let other = total - (hiragana + katakana + kanji + alphabet);

  let wordFreq = {};
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  document.getElementById("charCount").innerText = charCount;
  document.getElementById("charCountNoSpace").innerText = charCountNoSpace;
  document.getElementById("wordCount").innerText = wordCount;
  document.getElementById("lineCount").innerText = lineCount;
  document.getElementById("symbolCount").innerText = symbolCount;
  document.getElementById("hiraganaPercent").innerText = (
    (hiragana / total) *
    100
  ).toFixed(1);
  document.getElementById("katakanaPercent").innerText = (
    (katakana / total) *
    100
  ).toFixed(1);
  document.getElementById("kanjiPercent").innerText = (
    (kanji / total) *
    100
  ).toFixed(1);
  document.getElementById("alphabetPercent").innerText = (
    (alphabet / total) *
    100
  ).toFixed(1);
  document.getElementById("otherPercent").innerText = (
    (other / total) *
    100
  ).toFixed(1);

  let wordList = document.getElementById("wordFrequency");
  wordList.innerHTML = "";
  Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([word, count]) => {
      let li = document.createElement("li");
      li.innerText = `${word}: ${count}回`;
      wordList.appendChild(li);
    });
}

document.getElementById("textInput").addEventListener("input", analyzeText);
