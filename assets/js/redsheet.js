    document.addEventListener('DOMContentLoaded', () => {
        const qa = sel => document.querySelector(sel);
        const questionInput = qa('#question-input'), answerInput = qa('#answer-input'), addButton = qa('#add-button');
        const questionList = qa('#question-list'), questionCount = qa('#question-count');
        const shuffleButton = qa('#shuffle-button'), toggleAllButton = qa('#toggle-all-button');
        const startFocusModeButton = qa('#start-focus-mode-button'), startQuizModeButton = qa('#start-quiz-mode-button'), quizModeNotice = qa('#quiz-mode-notice');
        const matchingCountInput = qa('#matching-count-input'), startMatchingModeButton = qa('#start-matching-mode-button'), matchingModeNotice = qa('#matching-mode-notice');
        const generateUrlButton = qa('#generate-url-button'), exportJsonButton = qa('#export-json-button'), importJsonInput = qa('#import-json-input'), printButton = qa('#print-button');
        const focusModal = qa('#focus-mode-modal'), focusCounter = qa('#focus-counter'), focusQuestion = qa('#focus-question'), focusAnswerArea = qa('#focus-answer-area'), focusAnswer = qa('#focus-answer');
        const focusToggleAnswerButton = qa('#focus-toggle-answer-button'), focusPrevButton = qa('#focus-prev-button'), focusNextButton = qa('#focus-next-button'), focusCloseButton = qa('#focus-close-button');
        const quizModal = qa('#quiz-mode-modal'), quizCounter = qa('#quiz-counter'), quizQuestion = qa('#quiz-question'), quizOptions = qa('#quiz-options');
        const quizNextButton = qa('#quiz-next-button'), quizCloseButton = qa('#quiz-close-button');
        const matchingModal = qa('#matching-mode-modal'), matchingContainer = qa('#matching-container'), matchingQuestions = qa('#matching-questions'), matchingAnswers = qa('#matching-answers'), matchingProgress = qa('#matching-progress');
        const matchingResetButton = qa('#matching-reset-button'), matchingCloseButton = qa('#matching-close-button');
        const toast = qa('#toast-notification');
        
        // Move modal overlays and toast to body root to avoid stacking/context issues inside <main>
        [focusModal, quizModal, matchingModal, toast].forEach(el => {
            if (el && el.parentNode !== document.body) {
                document.body.appendChild(el);
            }
        });
        
        let questions = []; let allAnswersVisible = false; let currentFocusIndex = 0;
        let currentQuizIndex = 0; let quizQuestions = []; let quizMistakes = [];
        let selectedMatchingItem = null; let allMatchingQuestions = []; let matchedPairs = new Set();

        const tabs = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(item => item.classList.remove('active'));
                tab.classList.add('active');
                const targetTab = qa(`#${tab.dataset.tab}-tab`);
                tabContents.forEach(content => content.classList.remove('active'));
                targetTab.classList.add('active');
            });
        });
        const showToast = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => { toast.classList.remove('show'); }, 2000); };
        const showModal = (modal) => { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('visible'), 10); document.body.classList.add('modal-open'); };
        const hideModal = (modal) => { modal.classList.remove('visible'); setTimeout(() => { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }, 300); };
        
        const shuffleArray = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
        const sanitizeHTML = str => str.replace(/\n/g, '<br>');
        const levenshteinDistance = (str1 = '', str2 = '') => { const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null)); for (let i = 0; i <= str1.length; i += 1) { track[0][i] = i; } for (let j = 0; j <= str2.length; j += 1) { track[j][0] = j; } for (let j = 1; j <= str2.length; j += 1) { for (let i = 1; i <= str1.length; i += 1) { const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1; track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator); } } return track[str2.length][str1.length]; };
        
        const updateButtonsState = () => { const count = questions.length; const hasQuestions = count > 0; const canStartQuiz = count >= 4; const canStartMatching = count >= 5; shuffleButton.disabled = toggleAllButton.disabled = startFocusModeButton.disabled = !hasQuestions; startQuizModeButton.disabled = !canStartQuiz; quizModeNotice.style.display = canStartQuiz ? 'none' : 'block'; startMatchingModeButton.disabled = !canStartMatching; matchingModeNotice.style.display = canStartMatching ? 'none' : `block`; matchingModeNotice.textContent = `（5問以上で利用可）`; if(hasQuestions) matchingCountInput.max = count; generateUrlButton.disabled = exportJsonButton.disabled = printButton.disabled = !hasQuestions; };
        
        const renderQuestions = () => {
            questionList.innerHTML = ''; questionCount.textContent = questions.length; updateButtonsState();
            if (questions.length === 0) { questionList.innerHTML = '<p style="text-align:center; color: #999;">問題がありません。作成してください。</p>'; return; }
            questions.forEach((q, index) => {
                const li = document.createElement('li'); li.className = 'question-item';
                li.innerHTML = `<div class="question-item-header"><div class="question-text">Q${index + 1}: ${sanitizeHTML(q.question)}</div><div class="actions no-print"><button class="delete-button" data-index="${index}">削除</button></div></div><div class="answer-text hidden">A: ${sanitizeHTML(q.answer)}</div>`;
                questionList.appendChild(li);
            });
            updateAllAnswersVisibility();
        };

        const addQuestion = () => { const q = questionInput.value.trim(), a = answerInput.value.trim(); if (q && a) { questions.push({ id: Date.now(), question: q, answer: a }); questionInput.value = answerInput.value = ''; renderQuestions(); questionInput.focus(); showToast('問題を追加しました。'); } else { alert('問題と答えを入力してください。'); } };
        const deleteQuestion = index => { if (confirm(`問題${index + 1}を削除しますか？`)) { questions.splice(index, 1); renderQuestions(); showToast('問題を削除しました。'); } };
        const updateAllAnswersVisibility = () => document.querySelectorAll('.answer-text').forEach(el => allAnswersVisible ? el.classList.remove('hidden') : el.classList.add('hidden'));
        
        const renderFocusQuestion = () => { const q = questions[currentFocusIndex]; focusCounter.textContent = `${currentFocusIndex + 1} / ${questions.length}`; focusQuestion.innerHTML = `Q: ${sanitizeHTML(q.question)}`; focusAnswer.innerHTML = sanitizeHTML(q.answer); focusAnswerArea.classList.remove('visible'); focusToggleAnswerButton.textContent = '答えを見る (Space)'; focusPrevButton.disabled = currentFocusIndex === 0; focusNextButton.disabled = currentFocusIndex === questions.length - 1; };
        const startFocusMode = () => { currentFocusIndex = 0; renderFocusQuestion(); showModal(focusModal); };
        const endFocusMode = () => { hideModal(focusModal); };
        
        const renderQuizQuestion = () => {
            quizOptions.innerHTML = ''; quizNextButton.style.display = 'none';
            const currentQ = quizQuestions[currentQuizIndex]; const correctAnswer = currentQ.answer;
            quizCounter.textContent = `${currentQuizIndex + 1} / ${quizQuestions.length}`; quizQuestion.innerHTML = `Q: ${sanitizeHTML(currentQ.question)}`;
            const otherAnswers = questions.map(q => q.answer).filter(ans => ans !== correctAnswer);
            const incorrectOptions = [...new Set(otherAnswers)].map(ans => ({ text: ans, distance: levenshteinDistance(correctAnswer, ans) })).sort((a, b) => a.distance - b.distance).slice(0, 3).map(item => item.text);
            const options = shuffleArray([correctAnswer, ...incorrectOptions]);
            options.forEach((option, index) => {
                const container = document.createElement('div'); container.className = 'quiz-option-container';
                const button = document.createElement('button'); button.className = 'quiz-option-button';
                button.innerHTML = sanitizeHTML(option); button.dataset.key = index + 1;
                button.addEventListener('click', () => checkAnswer(button, option, correctAnswer));
                container.appendChild(button); quizOptions.appendChild(container);
            });
        };
        const checkAnswer = (button, selectedAnswer, correctAnswer) => {
            Array.from(document.querySelectorAll('.quiz-option-button')).forEach(btn => btn.disabled = true);
            const isCorrect = selectedAnswer === correctAnswer;
            if (isCorrect) {
                button.classList.add('correct');
                setTimeout(() => { if (currentQuizIndex < quizQuestions.length - 1) { currentQuizIndex++; renderQuizQuestion(); } else { handleQuizCompletion(); } }, 800);
            } else {
                const currentQ = quizQuestions[currentQuizIndex]; if (!quizMistakes.find(q => q.id === currentQ.id)) { quizMistakes.push(currentQ); }
                button.classList.add('incorrect');
                Array.from(quizOptions.querySelectorAll('.quiz-option-button')).forEach(btn => {
                    const btnAnswerText = btn.textContent;
                    if (btnAnswerText === correctAnswer) { btn.classList.add('correct'); }
                    else if (btn.classList.contains('incorrect')) {
                        const originalQuestion = questions.find(q => q.answer === btnAnswerText);
                        if (originalQuestion) { const explanation = document.createElement('div'); explanation.className = 'quiz-explanation'; explanation.textContent = `（これは「${originalQuestion.question}」の答えです）`; btn.parentElement.appendChild(explanation); }
                    }
                });
                quizNextButton.style.display = 'block';
                if (currentQuizIndex === quizQuestions.length - 1) { quizNextButton.textContent = '結果を見る'; }
            }
        };
        const handleQuizCompletion = () => { const total = quizQuestions.length; const mistakesCount = quizMistakes.length; const correctCount = total - mistakesCount; let message = mistakesCount === 0 ? '全問正解です！素晴らしい！' : `${total}問中、${correctCount}問正解でした。`; setTimeout(() => { alert(message); if (mistakesCount > 0 && confirm('間違えた問題に再挑戦しますか？')) { quizQuestions = shuffleArray([...quizMistakes]); quizMistakes = []; currentQuizIndex = 0; renderQuizQuestion(); } else { endQuizMode(); } }, 200); };
        const startQuizMode = () => { if (questions.length < 4) return; quizQuestions = shuffleArray([...questions]); quizMistakes = []; currentQuizIndex = 0; quizNextButton.textContent = '次の問題へ'; renderQuizQuestion(); showModal(quizModal); };
        const endQuizMode = () => { hideModal(quizModal); };
        
        // ★★★★★ 全問表示型マッチングモード ★★★★★
        const startMatchingMode = () => {
            const count = parseInt(matchingCountInput.value, 10);
            if (count < 5 || count > questions.length) { alert(`問題数は5以上、${questions.length}以下で指定してください。`); return; }
            
            // 全問を表示用に準備
            allMatchingQuestions = shuffleArray([...questions]).slice(0, count);
            matchedPairs = new Set();
            
            renderMatchingGame();
            showModal(matchingModal);
        };
        
        const renderMatchingGame = () => {
            selectedMatchingItem = null;
            matchingQuestions.innerHTML = '';
            matchingAnswers.innerHTML = '';
            
            // 問題列を作成
            allMatchingQuestions.forEach(item => {
                const li = document.createElement('li');
                li.className = 'matching-item';
                li.innerHTML = sanitizeHTML(item.question);
                li.dataset.id = item.id;
                li.dataset.type = 'question';
                if (matchedPairs.has(item.id)) {
                    li.classList.add('matched');
                }
                matchingQuestions.appendChild(li);
            });
            
            // 答え列を作成（シャッフル）
            const shuffledAnswers = shuffleArray([...allMatchingQuestions]);
            shuffledAnswers.forEach(item => {
                const li = document.createElement('li');
                li.className = 'matching-item';
                li.innerHTML = sanitizeHTML(item.answer);
                li.dataset.id = item.id;
                li.dataset.type = 'answer';
                if (matchedPairs.has(item.id)) {
                    li.classList.add('matched');
                }
                matchingAnswers.appendChild(li);
            });
            
            updateMatchingProgress();
        };

        const handleMatchingClick = e => {
            const target = e.target.closest('.matching-item');
            // クリック対象外、または既にマッチ済みの場合は処理しない
            if (!target || target.classList.contains('matched') || !target.dataset.id) return;

            // 1つ目のアイテムを選択
            if (!selectedMatchingItem) {
                // 他に選択中のアイテムがあれば処理を中断
                if (document.querySelector('.matching-item.selected')) return;
                selectedMatchingItem = target;
                target.classList.add('selected');
            } 
            // 2つ目のアイテムを選択
            else {
                // 同じアイテムや同じ種類（問題同士・答え同士）を選択した場合は選択を解除
                if (target === selectedMatchingItem || target.dataset.type === selectedMatchingItem.dataset.type) {
                    selectedMatchingItem.classList.remove('selected');
                    selectedMatchingItem = null;
                    return;
                }
                
                // questionとanswerの要素を特定
                let questionEl, answerEl;
                if (selectedMatchingItem.dataset.type === 'question') {
                    questionEl = selectedMatchingItem;
                    answerEl = target;
                } else {
                    questionEl = target;
                    answerEl = selectedMatchingItem;
                }
                
                // IDを比較して正解かどうかを判定
                if (questionEl.dataset.id === answerEl.dataset.id) {
                    // 正解の場合
                    matchingContainer.style.pointerEvents = 'none'; // 連打防止
                    questionEl.classList.add('matched');
                    answerEl.classList.add('matched');
                    selectedMatchingItem.classList.remove('selected');
                    selectedMatchingItem = null;
                    
                    // マッチしたペアを記録
                    matchedPairs.add(questionEl.dataset.id);
                    
                    setTimeout(() => {
                        updateMatchingProgress();
                        matchingContainer.style.pointerEvents = 'auto';
                        
                        // 全ての問題を解き終わったかチェック
                        if (matchedPairs.size === allMatchingQuestions.length) {
                            setTimeout(() => {
                                alert('全問正解！クリアです！');
                                endMatchingMode();
                            }, 500);
                        }
                    }, 400);
                } else {
                    // 不正解の場合
                    questionEl.classList.add('incorrect-flash');
                    answerEl.classList.add('incorrect-flash');
                    const prevSelectedItem = selectedMatchingItem;
                    selectedMatchingItem = null;
                    // アニメーションが終わった後にクラスを削除
                    setTimeout(() => {
                        questionEl.classList.remove('incorrect-flash', 'selected');
                        answerEl.classList.remove('incorrect-flash', 'selected');
                        if (prevSelectedItem) prevSelectedItem.classList.remove('incorrect-flash', 'selected');
                    }, 500);
                }
            }
        };

        const updateMatchingProgress = () => { 
            const totalCount = allMatchingQuestions.length; 
            const solvedCount = matchedPairs.size; 
            matchingProgress.textContent = `${solvedCount} / ${totalCount}`; 
        };
        const endMatchingMode = () => { hideModal(matchingModal); };
        
        const generateShareUrl = () => { try { const jsonString = JSON.stringify(questions); const compressed = pako.deflate(jsonString, { to: 'string' }); const base64String = btoa(compressed); const url = `${location.origin}${location.pathname}#${base64String}`; navigator.clipboard.writeText(url).then(() => showToast('共有URLをクリップボードにコピーしました。')); } catch (e) { alert('URLの生成に失敗しました。'); } };
        const loadFromUrl = () => { if (location.hash) { try { const base64String = location.hash.substring(1); const compressed = atob(base64String); const jsonString = pako.inflate(compressed, { to: 'string' }); const data = JSON.parse(jsonString); if (Array.isArray(data)) { if (data.length > 0 && typeof data[0].id === 'undefined') { data.forEach((item, index) => { item.id = Date.now() + index; }); } questions = data; renderQuestions(); showToast(`${data.length}問の問題をURLから読み込みました。`); } } catch (e) { alert('URLのデータが不正か、古い形式のため読み込めませんでした。'); history.replaceState(null, '', ' '); } } };
        const exportToJson = () => { const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'web-akasheet-data.json'; a.click(); URL.revokeObjectURL(a.href); };
        const importFromJson = e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = re => { try { const data = JSON.parse(re.target.result); if (Array.isArray(data) && confirm(`${data.length}問を読込みますか？`)) { if (data.length > 0 && typeof data[0].id === 'undefined') { data.forEach((item, index) => { item.id = Date.now() + index; }); } questions = data; renderQuestions(); showToast(`${data.length}問の問題をファイルから読み込みました。`); } } catch (err) { alert('ファイルの読込に失敗しました。'); } }; reader.readAsText(file); e.target.value = ''; };
        
        addButton.addEventListener('click', addQuestion);
        toggleAllButton.addEventListener('click', () => { allAnswersVisible = !allAnswersVisible; updateAllAnswersVisibility(); });
        shuffleButton.addEventListener('click', () => { shuffleArray(questions); renderQuestions(); showToast('問題をシャッフルしました。'); });
        questionList.addEventListener('click', e => { if (e.target.classList.contains('answer-text')) { e.target.classList.toggle('hidden'); } if (e.target.classList.contains('delete-button')) { deleteQuestion(parseInt(e.target.dataset.index, 10)); } });
        startFocusModeButton.addEventListener('click', startFocusMode); startQuizModeButton.addEventListener('click', startQuizMode); startMatchingModeButton.addEventListener('click', startMatchingMode);
        focusCloseButton.addEventListener('click', endFocusMode); focusToggleAnswerButton.addEventListener('click', () => { focusAnswerArea.classList.toggle('visible'); focusToggleAnswerButton.textContent = focusAnswerArea.classList.contains('visible') ? '答えを隠す (Space)' : '答えを見る (Space)'; });
        focusNextButton.addEventListener('click', () => { if (!focusNextButton.disabled) { currentFocusIndex++; renderFocusQuestion(); } });
        focusPrevButton.addEventListener('click', () => { if (!focusPrevButton.disabled) { currentFocusIndex--; renderFocusQuestion(); } });
        quizCloseButton.addEventListener('click', endQuizMode); quizNextButton.addEventListener('click', () => { if (!quizNextButton.disabled) { if (currentQuizIndex < quizQuestions.length - 1) { currentQuizIndex++; renderQuizQuestion(); } else { handleQuizCompletion(); } } });
        matchingResetButton.addEventListener('click', startMatchingMode);
        matchingCloseButton.addEventListener('click', endMatchingMode); matchingModal.addEventListener('click', handleMatchingClick);
        generateUrlButton.addEventListener('click', generateShareUrl); exportJsonButton.addEventListener('click', exportToJson); importJsonInput.addEventListener('change', importFromJson); printButton.addEventListener('click', () => window.print());

        document.addEventListener('keydown', e => {
            const isAnyModalVisible = !!qa('.modal-overlay.visible');
            if (e.ctrlKey && e.key === 'Enter' && (document.activeElement === questionInput || document.activeElement === answerInput)) { e.preventDefault(); addButton.click(); }
            if (e.key === 'Escape' && isAnyModalVisible) { hideModal(qa('.modal-overlay.visible')); }
            if (focusModal.classList.contains('visible')) {
                if (e.key === ' ') { e.preventDefault(); focusToggleAnswerButton.click(); }
                if (e.key === 'ArrowRight') { focusNextButton.click(); } if (e.key === 'ArrowLeft') { focusPrevButton.click(); }
            }
            if (quizModal.classList.contains('visible')) {
                if (['1', '2', '3', '4'].includes(e.key)) { const choiceButton = qa(`.quiz-option-button[data-key="${e.key}"]`); if (choiceButton && !choiceButton.disabled) { choiceButton.click(); } }
                if (e.key === 'Enter' && quizNextButton.style.display === 'block') { quizNextButton.click(); }
            }
        });
        
        loadFromUrl();
        renderQuestions();
    });