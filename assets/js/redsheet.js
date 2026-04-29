document.addEventListener('DOMContentLoaded', () => {
    const qa = (sel) => document.querySelector(sel);

    const questionInput = qa('#question-input');
    const answerInput = qa('#answer-input');
    const addButton = qa('#add-button');
    const questionList = qa('#question-list');
    const questionCount = qa('#question-count');

    const shuffleButton = qa('#shuffle-button');
    const restoreOrderButton = qa('#restore-order-button');
    const toggleAllButton = qa('#toggle-all-button');

    const startFocusModeButton = qa('#start-focus-mode-button');
    const startQuizModeButton = qa('#start-quiz-mode-button');
    const quizModeNotice = qa('#quiz-mode-notice');

    const matchingCountInput = qa('#matching-count-input');
    const startMatchingModeButton = qa('#start-matching-mode-button');
    const matchingModeNotice = qa('#matching-mode-notice');

    const generateUrlButton = qa('#generate-url-button');
    const exportJsonButton = qa('#export-json-button');
    const importJsonInput = qa('#import-json-input');
    const clearAllButton = qa('#clear-all-button');
    const printButton = qa('#print-button');

    const focusModal = qa('#focus-mode-modal');
    const focusCounter = qa('#focus-counter');
    const focusQuestion = qa('#focus-question');
    const focusAnswerArea = qa('#focus-answer-area');
    const focusAnswer = qa('#focus-answer');
    const focusToggleAnswerButton = qa('#focus-toggle-answer-button');
    const focusPrevButton = qa('#focus-prev-button');
    const focusNextButton = qa('#focus-next-button');
    const focusCloseButton = qa('#focus-close-button');

    const quizModal = qa('#quiz-mode-modal');
    const quizCounter = qa('#quiz-counter');
    const quizQuestion = qa('#quiz-question');
    const quizOptions = qa('#quiz-options');
    const quizResult = qa('#quiz-result');
    const quizNextButton = qa('#quiz-next-button');
    const quizCloseButton = qa('#quiz-close-button');

    const matchingModal = qa('#matching-mode-modal');
    const matchingContainer = qa('#matching-container');
    const matchingQuestions = qa('#matching-questions');
    const matchingAnswers = qa('#matching-answers');
    const matchingProgress = qa('#matching-progress');
    const matchingResetButton = qa('#matching-reset-button');
    const matchingCloseButton = qa('#matching-close-button');

    const toast = qa('#toast-notification');
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    const STORAGE_KEY = 'redsheet-questions';

    let questions = [];
    let allAnswersVisible = false;
    let currentFocusIndex = 0;
    let currentQuizIndex = 0;
    let quizQuestions = [];
    let quizMistakes = [];
    let quizResultVisible = false;
    let selectedMatchingItem = null;
    let allMatchingQuestions = [];
    let matchedPairs = new Set();
    let isReviewingMistakes = false;

    [focusModal, quizModal, matchingModal, toast].forEach((el) => {
        if (el && el.parentNode !== document.body) {
            document.body.appendChild(el);
        }
    });

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((item) => item.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = qa(`#${tab.dataset.tab}-tab`);
            tabContents.forEach((content) => content.classList.remove('active'));
            targetTab.classList.add('active');
        });
    });

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    };

    const showModal = (modal) => {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
        document.body.classList.add('modal-open');
    };

    const hideModal = (modal) => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 300);
    };

    const shuffleArray = (arr) => {
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const sanitizeHTML = (str) => str.replace(/\n/g, '<br>');

    const levenshteinDistance = (str1 = '', str2 = '') => {
        const track = Array(str2.length + 1)
            .fill(null)
            .map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i += 1) {
            track[0][i] = i;
        }

        for (let j = 0; j <= str2.length; j += 1) {
            track[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator,
                );
            }
        }

        return track[str2.length][str1.length];
    };

    const normalizeQuestion = (item, index) => ({
        id: item.id || Date.now() + index,
        sortIndex: typeof item.sortIndex === 'number' ? item.sortIndex : index,
        question: String(item.question || '').trim(),
        answer: String(item.answer || '').trim(),
    });

    const saveQuestions = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    };

    const loadStoredQuestions = () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.map(normalizeQuestion).sort((a, b) => a.sortIndex - b.sortIndex);
        } catch {
            return [];
        }
    };

    const setQuestions = (items) => {
        questions = items.map(normalizeQuestion);
        renderQuestions();
        saveQuestions();
    };

    const updateButtonsState = () => {
        const count = questions.length;
        const hasQuestions = count > 0;
        const canStartQuiz = count >= 4;
        const canStartMatching = count >= 5;

        shuffleButton.disabled = !hasQuestions;
        restoreOrderButton.disabled = !hasQuestions;
        toggleAllButton.disabled = !hasQuestions;
        startFocusModeButton.disabled = !hasQuestions;
        startQuizModeButton.disabled = !canStartQuiz;
        startMatchingModeButton.disabled = !canStartMatching;
        clearAllButton.disabled = !hasQuestions;

        quizModeNotice.style.display = canStartQuiz ? 'none' : 'block';
        matchingModeNotice.style.display = canStartMatching ? 'none' : 'block';
        matchingModeNotice.textContent = `（5問以上で利用可）`;

        if (hasQuestions) {
            matchingCountInput.max = count;
        }

        generateUrlButton.disabled = !hasQuestions;
        exportJsonButton.disabled = !hasQuestions;
        printButton.disabled = !hasQuestions;
    };

    const updateAllAnswersVisibility = () => {
        document.querySelectorAll('.answer-text').forEach((el) => {
            if (allAnswersVisible) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    };

    const renderQuestions = () => {
        questionList.innerHTML = '';
        questionCount.textContent = questions.length;
        updateButtonsState();

        if (questions.length === 0) {
            questionList.innerHTML = '<p style="text-align:center; color: #999;">問題がありません。作成してください。</p>';
            return;
        }

        questions.forEach((q, index) => {
            const li = document.createElement('li');
            li.className = 'question-item';
            li.innerHTML = `
                <div class="question-item-header">
                    <div class="question-text">Q${index + 1}: ${sanitizeHTML(q.question)}</div>
                    <div class="actions no-print">
                        <button class="delete-button" data-index="${index}">削除</button>
                    </div>
                </div>
                <div class="answer-text hidden">A: ${sanitizeHTML(q.answer)}</div>
            `;
            questionList.appendChild(li);
        });

        updateAllAnswersVisibility();
    };

    const addQuestion = () => {
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (!question || !answer) {
            alert('問題と答えを入力してください。');
            return;
        }

        questions.push({
            id: Date.now(),
            sortIndex: questions.length,
            question,
            answer,
        });

        questionInput.value = '';
        answerInput.value = '';
        renderQuestions();
        saveQuestions();
        questionInput.focus();
        showToast('問題を追加しました。');
    };

    const restoreOrder = () => {
        questions.sort((a, b) => a.sortIndex - b.sortIndex);
        renderQuestions();
        saveQuestions();
        showToast('元の順番に戻しました。');
    };

    const deleteQuestion = (index) => {
        if (!confirm(`問題${index + 1}を削除しますか？`)) {
            return;
        }

        questions.splice(index, 1);
        questions = questions.map((item, idx) => ({ ...item, sortIndex: idx }));
        renderQuestions();
        saveQuestions();
        showToast('問題を削除しました。');
    };

    const clearAllQuestions = () => {
        if (!confirm('全ての問題を削除しますか？この操作は取り消せません。')) {
            return;
        }

        questions = [];
        renderQuestions();
        saveQuestions();
        showToast('全ての問題を削除しました。');
    };

    const renderFocusQuestion = () => {
        const current = questions[currentFocusIndex];

        focusCounter.textContent = `${currentFocusIndex + 1} / ${questions.length}`;
        focusQuestion.innerHTML = `Q: ${sanitizeHTML(current.question)}`;
        focusAnswer.innerHTML = sanitizeHTML(current.answer);
        focusAnswerArea.classList.remove('visible');
        focusToggleAnswerButton.textContent = '答えを見る (Space)';
        focusPrevButton.disabled = currentFocusIndex === 0;
        focusNextButton.disabled = currentFocusIndex === questions.length - 1;
    };

    const startFocusMode = () => {
        currentFocusIndex = 0;
        renderFocusQuestion();
        showModal(focusModal);
    };

    const endFocusMode = () => {
        hideModal(focusModal);
    };

    const renderQuizQuestion = () => {
        quizOptions.innerHTML = '';
        quizOptions.style.display = '';
        quizQuestion.style.display = '';
        quizResult.classList.add('hidden');
        quizResult.innerHTML = '';
        quizNextButton.style.display = 'none';
        quizResultVisible = false;

        const currentQ = quizQuestions[currentQuizIndex];
        const correctAnswer = currentQ.answer;

        quizCounter.textContent = `${currentQuizIndex + 1} / ${quizQuestions.length}`;
        quizQuestion.innerHTML = `Q: ${sanitizeHTML(currentQ.question)}`;

        const otherAnswers = questions
            .map((item) => item.answer)
            .filter((answer) => answer !== correctAnswer);

        const incorrectOptions = [...new Set(otherAnswers)]
            .map((answer) => ({
                text: answer,
                distance: levenshteinDistance(correctAnswer, answer),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map((item) => item.text);

        const options = shuffleArray([correctAnswer, ...incorrectOptions]);

        options.forEach((option, index) => {
            const container = document.createElement('div');
            container.className = 'quiz-option-container';
            const button = document.createElement('button');
            button.className = 'quiz-option-button';
            button.innerHTML = sanitizeHTML(option);
            button.dataset.key = index + 1;
            button.addEventListener('click', () => checkAnswer(button, option, correctAnswer));
            container.appendChild(button);
            quizOptions.appendChild(container);
        });
    };

    const showQuizResult = (message, allowReview) => {
        quizResult.innerHTML = `<p>${sanitizeHTML(message)}</p>`;
        quizResult.classList.remove('hidden');
        quizNextButton.style.display = 'block';
        quizNextButton.textContent = allowReview ? '間違えた問題を復習' : '閉じる';
        quizResultVisible = true;
    };

    const handleQuizCompletion = () => {
        const total = quizQuestions.length;
        const mistakesCount = quizMistakes.length;
        const correctCount = total - mistakesCount;
        const message = mistakesCount === 0
            ? '全問正解です！素晴らしい！'
            : `${total}問中、${correctCount}問正解でした。`;

        quizOptions.innerHTML = '';
        quizOptions.style.display = 'none';
        quizCounter.textContent = '結果';
        quizQuestion.innerHTML = '';
        quizQuestion.style.display = 'none';
        showQuizResult(message, mistakesCount > 0);
    };

    const startQuizMode = () => {
        if (questions.length < 4) {
            return;
        }

        quizQuestions = shuffleArray([...questions]);
        quizMistakes = [];
        currentQuizIndex = 0;
        isReviewingMistakes = false;
        renderQuizQuestion();
        showModal(quizModal);
    };

    const endQuizMode = () => {
        hideModal(quizModal);
    };

    const checkAnswer = (button, selectedAnswer, correctAnswer) => {
        Array.from(document.querySelectorAll('.quiz-option-button')).forEach((btn) => {
            btn.disabled = true;
        });

        if (selectedAnswer === correctAnswer) {
            button.classList.add('correct');
            setTimeout(() => {
                if (currentQuizIndex < quizQuestions.length - 1) {
                    currentQuizIndex += 1;
                    renderQuizQuestion();
                } else {
                    handleQuizCompletion();
                }
            }, 800);
            return;
        }

        const currentQ = quizQuestions[currentQuizIndex];
        if (!quizMistakes.find((item) => item.id === currentQ.id)) {
            quizMistakes.push(currentQ);
        }

        button.classList.add('incorrect');
        Array.from(quizOptions.querySelectorAll('.quiz-option-button')).forEach((btn) => {
            const btnAnswerText = btn.textContent;
            if (btnAnswerText === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.classList.contains('incorrect')) {
                const originalQuestion = questions.find((item) => item.answer === btnAnswerText);
                if (originalQuestion) {
                    const explanation = document.createElement('div');
                    explanation.className = 'quiz-explanation';
                    explanation.textContent = `（これは「${originalQuestion.question}」の答えです）`;
                    btn.parentElement.appendChild(explanation);
                }
            }
        });

        quizNextButton.style.display = 'block';
        quizNextButton.textContent = '次の問題へ (Enter)';
    };

    const startMatchingMode = () => {
        const count = parseInt(matchingCountInput.value, 10);
        if (count < 5 || count > questions.length) {
            alert(`問題数は5以上、${questions.length}以下で指定してください。`);
            return;
        }

        allMatchingQuestions = shuffleArray([...questions]).slice(0, count);
        matchedPairs = new Set();
        renderMatchingGame();
        showModal(matchingModal);
    };

    const renderMatchingGame = () => {
        selectedMatchingItem = null;
        matchingQuestions.innerHTML = '';
        matchingAnswers.innerHTML = '';

        allMatchingQuestions.forEach((item) => {
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

        const shuffledAnswers = shuffleArray([...allMatchingQuestions]);
        shuffledAnswers.forEach((item) => {
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

    const handleMatchingClick = (event) => {
        const target = event.target.closest('.matching-item');
        if (!target || target.classList.contains('matched') || !target.dataset.id) {
            return;
        }

        if (!selectedMatchingItem) {
            if (document.querySelector('.matching-item.selected')) {
                return;
            }
            selectedMatchingItem = target;
            target.classList.add('selected');
            return;
        }

        if (target === selectedMatchingItem || target.dataset.type === selectedMatchingItem.dataset.type) {
            selectedMatchingItem.classList.remove('selected');
            selectedMatchingItem = null;
            return;
        }

        let questionEl;
        let answerEl;
        if (selectedMatchingItem.dataset.type === 'question') {
            questionEl = selectedMatchingItem;
            answerEl = target;
        } else {
            questionEl = target;
            answerEl = selectedMatchingItem;
        }

        if (questionEl.dataset.id === answerEl.dataset.id) {
            matchingContainer.style.pointerEvents = 'none';
            questionEl.classList.add('matched');
            answerEl.classList.add('matched');
            selectedMatchingItem.classList.remove('selected');
            selectedMatchingItem = null;
            matchedPairs.add(questionEl.dataset.id);

            setTimeout(() => {
                updateMatchingProgress();
                matchingContainer.style.pointerEvents = 'auto';
                if (matchedPairs.size === allMatchingQuestions.length) {
                    setTimeout(() => {
                        alert('全問正解！クリアです！');
                        endMatchingMode();
                    }, 500);
                }
            }, 400);
            return;
        }

        questionEl.classList.add('incorrect-flash');
        answerEl.classList.add('incorrect-flash');
        const prevSelectedItem = selectedMatchingItem;
        selectedMatchingItem = null;

        setTimeout(() => {
            questionEl.classList.remove('incorrect-flash', 'selected');
            answerEl.classList.remove('incorrect-flash', 'selected');
            if (prevSelectedItem) {
                prevSelectedItem.classList.remove('incorrect-flash', 'selected');
            }
        }, 500);
    };

    const updateMatchingProgress = () => {
        matchingProgress.textContent = `${matchedPairs.size} / ${allMatchingQuestions.length}`;
    };

    const endMatchingMode = () => {
        hideModal(matchingModal);
    };

    const generateShareUrl = () => {
        try {
            const jsonString = JSON.stringify(questions);
            const compressed = pako.deflate(jsonString, { to: 'string' });
            const base64String = btoa(compressed);
            const url = `${location.origin}${location.pathname}#${base64String}`;
            navigator.clipboard.writeText(url).then(() => {
                showToast('共有URLをクリップボードにコピーしました。');
            });
        } catch {
            alert('URLの生成に失敗しました。');
        }
    };

    const loadFromUrl = () => {
        if (!location.hash) {
            return false;
        }

        try {
            const base64String = location.hash.substring(1);
            const compressed = atob(base64String);
            const jsonString = pako.inflate(compressed, { to: 'string' });
            const data = JSON.parse(jsonString);

            if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0].id === 'undefined') {
                    data.forEach((item, index) => {
                        item.id = Date.now() + index;
                        item.sortIndex = index;
                    });
                }
                setQuestions(data);
                showToast(`${data.length}問の問題をURLから読み込みました。`);
                return true;
            }
        } catch {
            alert('URLのデータが不正か、古い形式のため読み込めませんでした。');
            history.replaceState(null, '', location.pathname);
        }

        return false;
    };

    const exportToJson = () => {
        const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'web-akasheet-data.json';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const importFromJson = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const data = JSON.parse(loadEvent.target.result);
                if (Array.isArray(data) && confirm(`${data.length}問を読込みますか？`)) {
                    if (data.length > 0 && typeof data[0].id === 'undefined') {
                        data.forEach((item, index) => {
                            item.id = Date.now() + index;
                            item.sortIndex = index;
                        });
                    }
                    setQuestions(data);
                    showToast(`${data.length}問の問題をファイルから読み込みました。`);
                }
            } catch {
                alert('ファイルの読込に失敗しました。');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    addButton.addEventListener('click', addQuestion);
    toggleAllButton.addEventListener('click', () => {
        allAnswersVisible = !allAnswersVisible;
        updateAllAnswersVisibility();
    });
    shuffleButton.addEventListener('click', () => {
        shuffleArray(questions);
        renderQuestions();
        saveQuestions();
        showToast('問題をシャッフルしました。');
    });
    restoreOrderButton.addEventListener('click', restoreOrder);
    questionList.addEventListener('click', (event) => {
        if (event.target.classList.contains('answer-text')) {
            event.target.classList.toggle('hidden');
        }
        if (event.target.classList.contains('delete-button')) {
            deleteQuestion(parseInt(event.target.dataset.index, 10));
        }
    });
    startFocusModeButton.addEventListener('click', startFocusMode);
    startQuizModeButton.addEventListener('click', startQuizMode);
    startMatchingModeButton.addEventListener('click', startMatchingMode);

    focusCloseButton.addEventListener('click', endFocusMode);
    focusToggleAnswerButton.addEventListener('click', () => {
        focusAnswerArea.classList.toggle('visible');
        focusToggleAnswerButton.textContent = focusAnswerArea.classList.contains('visible')
            ? '答えを隠す (Space)'
            : '答えを見る (Space)';
    });
    focusNextButton.addEventListener('click', () => {
        if (!focusNextButton.disabled) {
            currentFocusIndex += 1;
            renderFocusQuestion();
        }
    });
    focusPrevButton.addEventListener('click', () => {
        if (!focusPrevButton.disabled) {
            currentFocusIndex -= 1;
            renderFocusQuestion();
        }
    });

    quizCloseButton.addEventListener('click', endQuizMode);
    quizNextButton.addEventListener('click', () => {
        if (quizResultVisible) {
            if (quizMistakes.length > 0) {
                isReviewingMistakes = true;
                quizQuestions = shuffleArray([...quizMistakes]);
                quizMistakes = [];
                currentQuizIndex = 0;
                renderQuizQuestion();
                return;
            }
            endQuizMode();
            return;
        }
        if (currentQuizIndex < quizQuestions.length - 1) {
            currentQuizIndex += 1;
            renderQuizQuestion();
        } else {
            handleQuizCompletion();
        }
    });

    matchingResetButton.addEventListener('click', startMatchingMode);
    matchingCloseButton.addEventListener('click', endMatchingMode);
    matchingModal.addEventListener('click', handleMatchingClick);
    generateUrlButton.addEventListener('click', generateShareUrl);
    exportJsonButton.addEventListener('click', exportToJson);
    importJsonInput.addEventListener('change', importFromJson);
    clearAllButton.addEventListener('click', clearAllQuestions);
    printButton.addEventListener('click', () => window.print());

    document.addEventListener('keydown', (event) => {
        const isAnyModalVisible = !!qa('.modal-overlay.visible');

        if (event.ctrlKey && event.key === 'Enter' && (document.activeElement === questionInput || document.activeElement === answerInput)) {
            event.preventDefault();
            addButton.click();
        }

        if (event.key === 'Escape' && isAnyModalVisible) {
            hideModal(qa('.modal-overlay.visible'));
        }

        if (focusModal.classList.contains('visible')) {
            if (event.key === ' ') {
                event.preventDefault();
                focusToggleAnswerButton.click();
            }
            if (event.key === 'ArrowRight') {
                focusNextButton.click();
            }
            if (event.key === 'ArrowLeft') {
                focusPrevButton.click();
            }
        }

        if (quizModal.classList.contains('visible')) {
            if (['1', '2', '3', '4'].includes(event.key)) {
                const choiceButton = qa(`.quiz-option-button[data-key="${event.key}"]`);
                if (choiceButton && !choiceButton.disabled) {
                    choiceButton.click();
                }
            }
            if (event.key === 'Enter' && quizNextButton.style.display === 'block') {
                quizNextButton.click();
            }
        }
    });

    const initialize = () => {
        if (!loadFromUrl()) {
            setQuestions(loadStoredQuestions());
        }
    };

    initialize();
});
