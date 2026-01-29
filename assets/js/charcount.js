function analyzeText() {
  let text = document.getElementById("textInput").value;
  let isCaseInsensitive = document.getElementById("caseInsensitive").checked;
  let includeSymbolsInPercent = document.getElementById("includeSymbolsInPercent").checked;
  let segmenter = new TinySegmenter();

  let rawWords = text.split(/\r?\n/).flatMap((line) => segmenter.segment(line));
  
  // Robust merging of hyphenated words (e.g., [word, "-", word, "-", word] -> [word-word-word])
  let words = [];
  for (let i = 0; i < rawWords.length; i++) {
    let token = rawWords[i];
    // Keep merging if the next segment is a hyphen followed by another alphanumeric segment
    while (i + 2 < rawWords.length && 
           rawWords[i + 1] === "-" && 
           /[a-zA-Z0-9]/.test(token) && 
           /[a-zA-Z0-9]/.test(rawWords[i + 2])) {
      token = token + "-" + rawWords[i + 2];
      i += 2;
    }
    words.push(token);
  }
  
  // Filter out empty strings and strings that don't contain at least one alphanumeric or East Asian letter character.
  words = words.filter((word) => 
    /[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/.test(word)
  );

  let charCount = text.length;
  let charCountNoSpace = text.replace(/\s/g, "").length;
  let wordCount = words.length;
  let lineCount = text.split(/\r?\n/).length;
  // Improved symbol count regex covering common Japanese and English punctuation/symbols
  let symbolCount = (text.match(/[、。！？…・「」『』（）［］【】.,!?:;()\[\]{}/\\|+=\-_*&^%$#@~"']/g) || []).length;

  let hiragana = (text.match(/[ぁ-ん]/g) || []).length;
  let katakana = (text.match(/[ァ-ン]/g) || []).length;
  let kanji = (text.match(/[一-龥]/g) || []).length;
  let alphabet = (text.match(/[a-zA-Z]/g) || []).length;
  
  let totalForPercent;
  if (includeSymbolsInPercent) {
    totalForPercent = charCount || 1;
  } else {
    totalForPercent = (hiragana + katakana + kanji + alphabet) || 1;
  }
  
  let other = (charCount || 0) - (hiragana + katakana + kanji + alphabet);

  let wordFreq = {};
  words.forEach((word) => {
    let key = isCaseInsensitive ? word.toLowerCase() : word;
    wordFreq[key] = (wordFreq[key] || 0) + 1;
  });

  document.getElementById("charCount").innerText = charCount;
  document.getElementById("charCountNoSpace").innerText = charCountNoSpace;
  document.getElementById("wordCount").innerText = wordCount;
  document.getElementById("lineCount").innerText = lineCount;
  document.getElementById("symbolCount").innerText = symbolCount;
  
  document.getElementById("hiraganaPercent").innerText = (
    (hiragana / totalForPercent) * 100
  ).toFixed(1);
  document.getElementById("katakanaPercent").innerText = (
    (katakana / totalForPercent) * 100
  ).toFixed(1);
  document.getElementById("kanjiPercent").innerText = (
    (kanji / totalForPercent) * 100
  ).toFixed(1);
  document.getElementById("alphabetPercent").innerText = (
    (alphabet / totalForPercent) * 100
  ).toFixed(1);
  let otherPercentVal = includeSymbolsInPercent ? (
    (other / totalForPercent) * 100
  ).toFixed(1) : "0.0";
  
  document.getElementById("otherPercent").innerText = otherPercentVal;
  
  // Hide the pill if it's 0.0% (especially when symbols are excluded or none are present)
  let otherPill = document.getElementById("otherPill");
  if (otherPercentVal === "0.0") {
    otherPill.style.display = "none";
  } else {
    otherPill.style.display = "flex";
  }

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
document.getElementById("caseInsensitive").addEventListener("change", analyzeText);
document.getElementById("includeSymbolsInPercent").addEventListener("change", analyzeText);
