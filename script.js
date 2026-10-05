/* =========================================================
   Kelime Bulmaca — Game Core
   Engine / State / UI ayrımı korunarak tek dosyada
========================================================= */

(function () {
    "use strict";

    /* -----------------------------------------------------
       DOM
    ----------------------------------------------------- */

    const homeScreen = document.getElementById("homeScreen");
    const levelsScreen = document.getElementById("levelsScreen");
    const gameScreen = document.getElementById("gameScreen");
    const settingsScreen = document.getElementById("settingsScreen");
    const dictionaryScreen = document.getElementById("dictionaryScreen");
    const statsScreen = document.getElementById("statsScreen");
    const levelsGrid = document.getElementById("levelsGrid");

    const puzzleElement = document.getElementById("puzzle");
    const acrossCluesElement = document.getElementById("acrossClues");
    const downCluesElement = document.getElementById("downClues");

    const answerModal = document.getElementById("answerModal");
    const modalBox = document.getElementById("modalBox");
    const answerInput = document.getElementById("answerInput");
    const modalNumber = document.getElementById("modalNumber");
    const modalQuestion = document.getElementById("modalQuestion");
    const modalLength = document.getElementById("modalLength");
    const resultMessage = document.getElementById("resultMessage");

    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");
    const levelTitleEl = document.getElementById("levelTitle");

    const hintButton = document.getElementById("hintButton");

    const completeModal = document.getElementById("completeModal");
    const completeStats = document.getElementById("completeStats");
    const completeTitle = document.getElementById("completeTitle");
    const nextLevelButton = document.getElementById("nextLevelButton");
    const backToLevelsButton = document.getElementById("backToLevelsButton");

    const homeCompletedText = document.getElementById("homeCompletedText");
    const homeLastLevelText = document.getElementById("homeLastLevelText");
    const homeProgressFill = document.getElementById("homeProgressFill");
    const homeProgressText = document.getElementById("homeProgressText");
    const completedLevelModal = document.getElementById("completedLevelModal");
    const settingsSoundToggle = document.getElementById("settingsSoundToggle");
    const settingsCollapsibleClues = document.getElementById("settingsCollapsibleClues");
    const cluesCard = document.getElementById("cluesCard");
    const cluePanelHandle = document.getElementById("cluePanelHandle");
    const cluesSheetBackdrop = document.getElementById("cluesSheetBackdrop");
    const dictionaryList = document.getElementById("dictionaryList");
    const dictionaryEmpty = document.getElementById("dictionaryEmpty");
    const dictionaryLevelFilter = document.getElementById("dictionaryLevelFilter");
    const dictionaryDifficultyFilter = document.getElementById("dictionaryDifficultyFilter");
    const dictionarySearch = document.getElementById("dictionarySearch");

    /* -----------------------------------------------------
       CONSTANTS / STORAGE
    ----------------------------------------------------- */

    const STORAGE_KEY = "kelimeBulmaca.progress.v1";
    const SOUND_STORAGE_KEY = "kare.sound.enabled.v1";
    const SETTINGS_STORAGE_KEY = "kare.settings.v1";
    const STATS_STORAGE_KEY = "kare.stats.v1";
    const LEVEL_STATUS = {
        LOCKED: "locked",
        UNLOCKED: "unlocked",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed"
    };

    /* -----------------------------------------------------
       GAME STATE
    ----------------------------------------------------- */

    let gridSize = 15;
    let grid = [];
    let placements = [];
    let currentWord = null;
    let selectedCell = null;
    let currentLevelId = 1;
    let pendingCompletedLevelId = null;
    let replayMode = false;
    let solvedWords = new Set();
    let wrongAttempts = {}; // wordId -> { count, lastAnswer }
    let hintsUsed = 0;
    let wrongTotal = 0;
    let levelStartedAt = 0;
    let answerBusy = false;
    let gameMode = "normal";
    let statsViewMode = "normal";
    let lives = 3;
    let timeAttackRemainingMs = 90000;
    let timeAttackInterval = null;
    let timeAttackScore = 0;
    let timeAttackWords = 0;
    let answerStreak = 0;
    let bestAnswerStreak = 0;

    function makeModeStats() {
        return {
            totalCorrect: 0,
            totalWrong: 0,
            totalHints: 0,
            totalWordsSolved: 0,
            uniqueWords: [],
            totalPlayTimeMs: 0,
            puzzlesCompleted: 0,
            currentStreak: 0,
            bestStreak: 0,
            timeAttackBestScore: 0
        };
    }

    function loadLearningStats() {
        const defaults = { normal: makeModeStats(), timeAttack: makeModeStats(), extreme: makeModeStats() };
        try {
            const parsed = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "{}");
            if (parsed.normal || parsed.timeAttack || parsed.extreme) {
                return {
                    normal: Object.assign(defaults.normal, parsed.normal || {}),
                    timeAttack: Object.assign(defaults.timeAttack, parsed.timeAttack || {}),
                    extreme: Object.assign(defaults.extreme, parsed.extreme || {})
                };
            }
            defaults.normal = Object.assign(defaults.normal, parsed);
            return defaults;
        } catch (error) {
            return defaults;
        }
    }

    let statsStore = loadLearningStats();
    let stats = statsStore.normal;

    function saveLearningStats() {
        try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(statsStore)); } catch (error) {}
    }

    function getModeLabel(mode) {
        return mode === "timeAttack" ? "Time Attack" : mode === "extreme" ? "Extreme Mod" : "Normal Mod";
    }

    function activateMode(mode) {
        if (!["normal", "timeAttack", "extreme"].includes(mode)) mode = "normal";
        if (typeof progressStore !== "undefined" && progress) {
            progressStore[gameMode] = progress;
            saveProgress();
        }
        gameMode = mode;
        stats = statsStore[mode];
        setActiveMode(mode);
        if (typeof progressStore !== "undefined") {
            progress = progressStore[mode];
        }
        answerStreak = stats.currentStreak || 0;
        bestAnswerStreak = stats.bestStreak || 0;
        if (gameMode !== "timeAttack") stopTimeAttackTimer();
        updateStatsUI();
    }

    function updateStatsUI() {
        const viewed = statsStore[statsViewMode] || makeModeStats();
        const streakEl = document.getElementById("homeStreakText");
        const learnedEl = document.getElementById("homeWordsText");
        if (streakEl) streakEl.textContent = String(statsStore[gameMode].currentStreak || 0);
        if (learnedEl) learnedEl.textContent = String((statsStore[gameMode].uniqueWords || []).length);

        const set=(id,value)=>{const el=document.getElementById(id); if(el) el.textContent=value;};
        const totalAnswers=viewed.totalCorrect+viewed.totalWrong;
        set("statsModeLabel", getModeLabel(statsViewMode));
        set("statsLearnedWords", viewed.uniqueWords.length);
        set("statsCorrect", viewed.totalCorrect);
        set("statsWrong", viewed.totalWrong);
        set("statsAccuracy", totalAnswers ? Math.round(viewed.totalCorrect/totalAnswers*100) + "%" : "—");
        set("statsBestStreak", String(viewed.bestStreak || 0));
        set("statsHints", viewed.totalHints);
        set("statsPuzzles", viewed.puzzlesCompleted);
        set("statsTimeAttack", viewed.timeAttackBestScore || 0);
        set("statsLives", statsViewMode === "extreme" ? "3 can / bulmaca" : "—");
    }

    function selectStatsMode(mode) {
        statsViewMode = mode;
        document.querySelectorAll("[data-stats-mode]").forEach(button => {
            button.classList.toggle("is-active", button.dataset.statsMode === mode);
        });
        updateStatsUI();
    }

    function recordCorrectWord(wordId) {
        stats.totalCorrect += 1;
        if (!stats.uniqueWords.includes(wordId)) {
            stats.uniqueWords.push(wordId);
            stats.totalWordsSolved = stats.uniqueWords.length;
        }
        answerStreak += 1;
        bestAnswerStreak = Math.max(bestAnswerStreak, answerStreak);
        stats.currentStreak = answerStreak;
        stats.bestStreak = Math.max(stats.bestStreak, bestAnswerStreak);
        saveLearningStats();
        updateStatsUI();
    }

    function recordWrongWord() {
        stats.totalWrong += 1;
        answerStreak = 0;
        stats.currentStreak = 0;
        saveLearningStats();
        updateStatsUI();
    }

    function recordHintUsed() {
        stats.totalHints += 1;
        saveLearningStats();
    }

    function stopTimeAttackTimer() {
        if (timeAttackInterval !== null) {
            window.clearInterval(timeAttackInterval);
            timeAttackInterval = null;
        }
    }

    function updateTimeAttackUI() {
        const timer=document.getElementById("timeAttackTimer");
        const score=document.getElementById("timeAttackScore");
        if (timer) timer.textContent = formatTime(Math.max(0,timeAttackRemainingMs));
        if (score) score.textContent = String(timeAttackScore);
        const wrap=document.getElementById("timeAttackHud");
        if (wrap) wrap.classList.toggle("is-danger", timeAttackRemainingMs <= 15000);
    }

    function updateExtremeUI() {
        const hud=document.getElementById("extremeHud");
        const value=document.getElementById("extremeLives");
        if (hud) hud.hidden = gameMode !== "extreme";
        if (value) value.textContent = String(lives);
        if (hintButton) {
            hintButton.disabled = gameMode === "extreme" && lives <= 0;
            hintButton.title = hintButton.disabled ? "Canın kalmadığı için ipucu kullanamazsın." : "";
        }
    }

    function startTimeAttackTimer() {
        stopTimeAttackTimer();
        timeAttackInterval = window.setInterval(() => {
            timeAttackRemainingMs -= 100;
            if (timeAttackRemainingMs <= 0) {
                timeAttackRemainingMs = 0;
                updateTimeAttackUI();
                stopTimeAttackTimer();
                showTimeAttackEndModal(false);
                return;
            }
            updateTimeAttackUI();
        }, 100);
        updateTimeAttackUI();
    }

    function showTimeAttackEndModal(completed) {
        stopTimeAttackTimer();
        const modal=document.getElementById("timeAttackModal");
        const title=document.getElementById("timeAttackEndTitle");
        const textEl=document.getElementById("timeAttackEndText");
        const scoreEl=document.getElementById("timeAttackEndScore");
        if (!modal) return;
        title.textContent = completed ? "Tur tamamlandı" : "Süre doldu";
        textEl.textContent = completed ? "Bulmacayı süre bitmeden tamamladın." : "Zaman bitti. Yeni bir tur deneyebilirsin.";
        scoreEl.innerHTML = "<strong>" + timeAttackScore + "</strong> puan · " + timeAttackWords + " kelime";
        if (timeAttackScore > (stats.timeAttackBestScore || 0)) {
            stats.timeAttackBestScore = timeAttackScore;
            saveLearningStats();
        }
        updateStatsUI();
        modal.classList.add("show");
        playSoundEffect(completed ? "complete" : "wrong");
    }

    function beginTimeAttackRound() {
        activateMode("timeAttack");
        const levels = getActiveLevels();
        const unlocked = levels.filter(level => progress.levels[level.id] && progress.levels[level.id].status !== LEVEL_STATUS.LOCKED);
        if (!unlocked.length) return;
        const level = unlocked[Math.floor(Math.random() * unlocked.length)];
        timeAttackRemainingMs=90000;
        timeAttackScore=0;
        timeAttackWords=0;
        startLevel(level.id,{forceNew:true,timeAttack:true});
    }

    function beginModeRound(mode) {
        activateMode(mode);
        const levels = getActiveLevels();
        const target = levels.find(level => progress.levels[level.id].status !== LEVEL_STATUS.LOCKED) || levels[0];
        if (target) startLevel(target.id, {forceNew:true});
    }

    let soundEnabled = true;
    let settings = { collapsibleClues: false };
    try { settings = Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}")); } catch (error) {}
    try {
        soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "false";
    } catch (error) {
        soundEnabled = true;
    }

    let audioContext = null;
    let masterGain = null;
    let musicGain = null;
    let homeMusicTimer = null;
    let homeMusicRunning = false;
    let audioUnlocked = false;

    function getAudioContext() {
        if (audioContext) {
            return audioContext;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return null;
        }

        try {
            audioContext = new AudioContextClass();
            masterGain = audioContext.createGain();
            musicGain = audioContext.createGain();
            masterGain.gain.value = soundEnabled ? 0.9 : 0;
            musicGain.gain.value = 0;
            musicGain.connect(masterGain);
            masterGain.connect(audioContext.destination);
            return audioContext;
        } catch (error) {
            audioContext = null;
            masterGain = null;
            musicGain = null;
            return null;
        }
    }

    function playTone(frequency, options) {
        if (!soundEnabled || !audioContext || audioContext.state !== "running") {
            return;
        }

        const settings = options || {};
        const destination = settings.destination || masterGain;
        const duration = settings.duration || 0.24;
        const attack = settings.attack || 0.025;
        const startAt = audioContext.currentTime + (settings.delay || 0);
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        const peak = Math.max(settings.volume || 0.04, 0.0002);

        oscillator.type = settings.waveform || "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        envelope.gain.setValueAtTime(0.0001, startAt);
        envelope.gain.exponentialRampToValueAtTime(
            peak,
            startAt + Math.min(attack, duration * 0.45)
        );
        envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            startAt + duration
        );
        oscillator.connect(envelope);
        envelope.connect(destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + 0.02);
    }

    function playHomeMusicPhrase() {
        if (
            !homeMusicRunning ||
            !soundEnabled ||
            !audioContext ||
            audioContext.state !== "running"
        ) {
            return;
        }

        const chord = [174.61, 220, 261.63, 349.23];
        chord.forEach((frequency, index) => {
            playTone(frequency, {
                destination: musicGain,
                delay: index * 0.12,
                duration: 7.7,
                volume: 0.022,
                attack: 1.1,
                waveform: "sine"
            });
        });

        const melody = [523.25, 392, 440, 659.25, 523.25, 349.23];
        melody.forEach((frequency, index) => {
            playTone(frequency, {
                destination: musicGain,
                delay: index * 1.35,
                duration: 1.35,
                volume: 0.03,
                attack: 0.16,
                waveform: "sine"
            });
        });
    }

    function startHomeMusic() {
        if (!soundEnabled || !audioUnlocked || !homeScreen.classList.contains("active")) {
            return;
        }

        const context = getAudioContext();
        if (!context) {

            return;
        }

        context.resume().then(() => {
            if (
                !soundEnabled ||
                !homeScreen.classList.contains("active") ||
                context.state !== "running"
            ) {

                return;
            }
            if (homeMusicRunning) {

                return;
            }

            homeMusicRunning = true;
            musicGain.gain.cancelScheduledValues(context.currentTime);
            musicGain.gain.setTargetAtTime(0.85, context.currentTime, 0.6);
            playHomeMusicPhrase();
            homeMusicTimer = window.setInterval(playHomeMusicPhrase, 8200);

        }).catch(() => {

        });
    }

    function stopHomeMusic() {
        homeMusicRunning = false;
        if (homeMusicTimer !== null) {
            window.clearInterval(homeMusicTimer);
            homeMusicTimer = null;
        }
        if (audioContext && musicGain && audioContext.state === "running") {
            musicGain.gain.cancelScheduledValues(audioContext.currentTime);
            musicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
        }
    }

    function unlockAudio() {
        if (!soundEnabled) {
            return Promise.resolve(null);
        }

        audioUnlocked = true;
        const context = getAudioContext();
        if (!context) {

            return Promise.resolve(null);
        }

        return context.resume().then(() => {

            if (context.state === "running" && homeScreen.classList.contains("active")) {
                startHomeMusic();
            }
            return context;
        }).catch(() => {

            return null;
        });
    }

    function playSoundEffect(kind) {
        if (!soundEnabled) {
            return;
        }

        const context = getAudioContext();
        if (!context) {
            return;
        }
        if (context.state !== "running") {
            context.resume().then(() => {
                if (soundEnabled && context.state === "running") {
                    playSoundEffect(kind);
                }
            }).catch(() => {});
            return;
        }

        const patterns = {
            correct: [
                [587.33, 0, 0.2],
                [783.99, 0.1, 0.26]
            ],
            wrong: [
                [293.66, 0, 0.2],
                [246.94, 0.13, 0.23]
            ],
            hint: [
                [659.25, 0, 0.24]
            ],
            complete: [
                [523.25, 0, 0.28],
                [659.25, 0.13, 0.28],
                [783.99, 0.26, 0.32],
                [1046.5, 0.43, 0.55]
            ]
        };

        (patterns[kind] || []).forEach(([frequency, delay, duration]) => {
            playTone(frequency, {
                delay,
                duration,
                volume: kind === "wrong" ? 0.06 : 0.085,
                attack: 0.018,
                waveform: "sine"
            });
        });
    }

    function setSoundEnabled(enabled) {
        soundEnabled = enabled;
        try {
            localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
        } catch (error) {
            // Ses tercihi, depolama kullanılamasa da geçerli oturumda çalışır.
        }

        const context = getAudioContext();
        if (!soundEnabled) {
            stopHomeMusic();
            if (context && masterGain && context.state === "running") {
                masterGain.gain.setTargetAtTime(0, context.currentTime, 0.04);
            }
        } else if (context) {
            context.resume().then(() => {
                if (!soundEnabled || !masterGain) {
                    return;
                }
                masterGain.gain.setTargetAtTime(0.9, context.currentTime, 0.04);
                if (homeScreen.classList.contains("active")) {
                    startHomeMusic();
                }
            }).catch(() => {});
        }

    }

    /* -----------------------------------------------------
       PROGRESS MANAGER
    ----------------------------------------------------- */

    function createDefaultProgress() {
        const levels = {};
        getActiveLevels().forEach((level, index) => {
            levels[level.id] = {
                status: index === 0 ? LEVEL_STATUS.UNLOCKED : LEVEL_STATUS.LOCKED,
                solvedWordIds: [],
                wrongAttempts: {},
                placements: null,
                hintsUsed: 0,
                wrongTotal: 0,
                bestTimeMs: null,
                lastPlayedAt: null
            };
        });
        return { currentLevelId: getActiveLevels()[0]?.id || 1, lastPlayedLevelId: null, levels };
    }

    function mergeProgress(base, parsed) {
        if (!parsed) return base;
        base.currentLevelId = parsed.currentLevelId || base.currentLevelId;
        base.lastPlayedLevelId = parsed.lastPlayedLevelId || null;
        Object.keys(base.levels).forEach((id) => {
            if (parsed.levels && parsed.levels[id]) {
                base.levels[id] = Object.assign(base.levels[id], parsed.levels[id]);
            }
        });
        return base;
    }

    function loadProgressStore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const store = {};
                ["normal","timeAttack","extreme"].forEach(mode => {
                    setActiveMode(mode);
                    store[mode] = createDefaultProgress();
                });
                setActiveMode("normal");
                return store;
            }
            const parsed = JSON.parse(raw);
            const store = {};
            if (parsed.modes) {
                ["normal","timeAttack","extreme"].forEach(mode => {
                    setActiveMode(mode);
                    store[mode] = mergeProgress(createDefaultProgress(), parsed.modes[mode]);
                });
            } else {
                setActiveMode("normal");
                store.normal = mergeProgress(createDefaultProgress(), parsed);
                ["timeAttack","extreme"].forEach(mode => {
                    setActiveMode(mode);
                    store[mode] = createDefaultProgress();
                });
            }
            setActiveMode("normal");
            return store;
        } catch (error) {
            const store = {};
            ["normal","timeAttack","extreme"].forEach(mode => {
                setActiveMode(mode);
                store[mode] = createDefaultProgress();
            });
            setActiveMode("normal");
            return store;
        }
    }

    let progressStore = loadProgressStore();
    let progress = progressStore.normal;

    function saveProgress() {
        try {
            progressStore[gameMode] = progress;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, modes: progressStore }));
        } catch (error) {
            console.warn("Progress save failed", error);
        }
    }

    function getCompletedCount() {
        return Object.values(progress.levels).filter(item => item.status === LEVEL_STATUS.COMPLETED).length;
    }

    function unlockLevel(levelId) {
        const entry = progress.levels[levelId];
        if (entry && entry.status === LEVEL_STATUS.LOCKED) entry.status = LEVEL_STATUS.UNLOCKED;
    }

    function getNextLevelId() {
        const levels = getActiveLevels();
        const index = levels.findIndex(level => level.id === currentLevelId);
        return index >= 0 && index + 1 < levels.length ? levels[index + 1].id : null;
    }

    /* -----------------------------------------------------
       ANSWER NORMALIZATION (TR / EN)
    ----------------------------------------------------- */

    function normalizeAnswer(value) {
        const foldMap = {
            ç: "C",
            Ç: "C",
            ğ: "G",
            Ğ: "G",
            ı: "I",
            I: "I",
            i: "I",
            İ: "I",
            ö: "O",
            Ö: "O",
            ş: "S",
            Ş: "S",
            ü: "U",
            Ü: "U"
        };

        return String(value || "")
            .trim()
            .replace(/\s+/g, "")
            .split("")
            .map((char) => foldMap[char] || char.toUpperCase())
            .join("");
    }

    /* -----------------------------------------------------
       CROSSWORD ENGINE
    ----------------------------------------------------- */

    function createEmptyGrid(size) {
        const newGrid = [];
        for (let row = 0; row < size; row++) {
            const rowData = [];
            for (let col = 0; col < size; col++) {
                rowData.push({
                    letter: null,
                    words: [],
                    number: null,
                    userLetter: ""
                });
            }
            newGrid.push(rowData);
        }
        return newGrid;
    }

    function getWordCells(word, row, col, direction) {
        const cells = [];
        const answer = normalizeAnswer(word.answer);
        for (let i = 0; i < answer.length; i++) {
            cells.push({
                row: direction === "down" ? row + i : row,
                col: direction === "across" ? col + i : col,
                letter: answer[i]
            });
        }
        return cells;
    }

    function isInsideGrid(row, col, size) {
        return row >= 0 && row < size && col >= 0 && col < size;
    }

    function buildGridFromPlacements(currentPlacements, size) {
        const testGrid = createEmptyGrid(size);
        for (const placement of currentPlacements) {
            const cells = getWordCells(
                placement.word,
                placement.row,
                placement.col,
                placement.direction
            );
            for (const cell of cells) {
                testGrid[cell.row][cell.col].letter = cell.letter;
                testGrid[cell.row][cell.col].words.push(placement.word.id);
            }
        }
        return testGrid;
    }

    function canPlaceWord(word, row, col, direction, currentPlacements, size) {
        const testGrid = buildGridFromPlacements(currentPlacements, size);
        const cells = getWordCells(word, row, col, direction);
        const placementKeys = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

        for (const cell of cells) {
            if (!isInsideGrid(cell.row, cell.col, size)) {
                return false;
            }
        }

        const beforeRow = direction === "down" ? row - 1 : row;
        const beforeCol = direction === "across" ? col - 1 : col;
        const afterRow = direction === "down" ? row + cells.length : row;
        const afterCol = direction === "across" ? col + cells.length : col;

        if (
            isInsideGrid(beforeRow, beforeCol, size) &&
            testGrid[beforeRow][beforeCol].letter !== null
        ) {
            return false;
        }

        if (
            isInsideGrid(afterRow, afterCol, size) &&
            testGrid[afterRow][afterCol].letter !== null
        ) {
            return false;
        }

        let crossingCount = 0;

        for (const cell of cells) {
            const existingCell = testGrid[cell.row][cell.col];

            if (existingCell.letter !== null) {
                if (existingCell.letter !== cell.letter) {
                    return false;
                }

                // Gerçek kesişim: zıt yönde bir kelime olmalı
                const hasOpposite = existingCell.words.some((wordId) => {
                    const placed = currentPlacements.find((item) => item.word.id === wordId);
                    return placed && placed.direction !== direction;
                });

                if (!hasOpposite) {
                    return false;
                }

                crossingCount += 1;
                continue;
            }

            const neighbours = [
                { row: cell.row - 1, col: cell.col },
                { row: cell.row + 1, col: cell.col },
                { row: cell.row, col: cell.col - 1 },
                { row: cell.row, col: cell.col + 1 }
            ];

            for (const neighbour of neighbours) {
                if (!isInsideGrid(neighbour.row, neighbour.col, size)) {
                    continue;
                }

                const neighbourCell = testGrid[neighbour.row][neighbour.col];
                if (neighbourCell.letter === null) {
                    continue;
                }

                // Komşu harf yalnızca bu kelimenin kendi hücresiyse kabul
                if (!placementKeys.has(`${neighbour.row},${neighbour.col}`)) {
                    return false;
                }
            }
        }

        if (currentPlacements.length > 0 && crossingCount === 0) {
            return false;
        }

        return true;
    }

    function findCandidates(word, currentPlacements, size) {
        const candidates = [];

        if (currentPlacements.length === 0) {
            const answer = normalizeAnswer(word.answer);
            candidates.push({
                word,
                row: Math.floor(size / 2),
                col: Math.floor((size - answer.length) / 2),
                direction: "across"
            });
            return candidates;
        }

        const testGrid = buildGridFromPlacements(currentPlacements, size);
        const answer = normalizeAnswer(word.answer);

        for (let existingRow = 0; existingRow < size; existingRow++) {
            for (let existingCol = 0; existingCol < size; existingCol++) {
                const existingCell = testGrid[existingRow][existingCol];
                if (existingCell.letter === null) {
                    continue;
                }

                for (let letterIndex = 0; letterIndex < answer.length; letterIndex++) {
                    if (answer[letterIndex] !== existingCell.letter) {
                        continue;
                    }

                    const acrossRow = existingRow;
                    const acrossCol = existingCol - letterIndex;
                    if (canPlaceWord(word, acrossRow, acrossCol, "across", currentPlacements, size)) {
                        candidates.push({
                            word,
                            row: acrossRow,
                            col: acrossCol,
                            direction: "across"
                        });
                    }

                    const downRow = existingRow - letterIndex;
                    const downCol = existingCol;
                    if (canPlaceWord(word, downRow, downCol, "down", currentPlacements, size)) {
                        candidates.push({
                            word,
                            row: downRow,
                            col: downCol,
                            direction: "down"
                        });
                    }
                }
            }
        }

        const uniqueCandidates = [];
        const used = new Set();
        for (const candidate of candidates) {
            const key = `${candidate.row},${candidate.col},${candidate.direction}`;
            if (!used.has(key)) {
                used.add(key);
                uniqueCandidates.push(candidate);
            }
        }
        return uniqueCandidates;
    }

    function backtrackPlacement(currentPlacements, remainingWords, size) {
        if (remainingWords.length === 0) {
            return currentPlacements;
        }

        let selectedWord = null;
        let selectedCandidates = null;

        for (const word of remainingWords) {
            const candidates = findCandidates(word, currentPlacements, size);
            if (candidates.length === 0) {
                continue;
            }
            if (
                selectedCandidates === null ||
                candidates.length < selectedCandidates.length
            ) {
                selectedWord = word;
                selectedCandidates = candidates;
            }
        }

        if (selectedCandidates === null) {
            return null;
        }

        for (const candidate of selectedCandidates) {
            const newPlacements = [...currentPlacements, candidate];
            const newRemaining = remainingWords.filter(
                (word) => word.id !== selectedWord.id
            );
            const result = backtrackPlacement(newPlacements, newRemaining, size);
            if (result) {
                return result;
            }
        }

        return null;
    }

    function extractRuns(testGrid, size, direction) {
        const runs = [];
        if (direction === "across") {
            for (let row = 0; row < size; row++) {
                let col = 0;
                while (col < size) {
                    if (testGrid[row][col].letter === null) {
                        col += 1;
                        continue;
                    }
                    const startCol = col;
                    let text = "";
                    while (col < size && testGrid[row][col].letter !== null) {
                        text += testGrid[row][col].letter;
                        col += 1;
                    }
                    if (text.length >= 2) {
                        runs.push({
                            row,
                            col: startCol,
                            direction: "across",
                            text
                        });
                    }
                }
            }
        } else {
            for (let col = 0; col < size; col++) {
                let row = 0;
                while (row < size) {
                    if (testGrid[row][col].letter === null) {
                        row += 1;
                        continue;
                    }
                    const startRow = row;
                    let text = "";
                    while (row < size && testGrid[row][col].letter !== null) {
                        text += testGrid[row][col].letter;
                        row += 1;
                    }
                    if (text.length >= 2) {
                        runs.push({
                            row: startRow,
                            col,
                            direction: "down",
                            text
                        });
                    }
                }
            }
        }
        return runs;
    }

    function validateCrossword(currentPlacements, size) {
        if (!currentPlacements || currentPlacements.length === 0) {
            return { valid: false, reason: "empty" };
        }

        const testGrid = buildGridFromPlacements(currentPlacements, size);

        for (const placement of currentPlacements) {
            const cells = getWordCells(
                placement.word,
                placement.row,
                placement.col,
                placement.direction
            );
            const expected = normalizeAnswer(placement.word.answer);
            let actual = "";
            for (const cell of cells) {
                if (!isInsideGrid(cell.row, cell.col, size)) {
                    return { valid: false, reason: "out-of-bounds" };
                }
                const gridLetter = testGrid[cell.row][cell.col].letter;
                if (gridLetter !== cell.letter) {
                    return { valid: false, reason: "letter-mismatch" };
                }
                actual += gridLetter;
            }
            if (actual !== expected) {
                return { valid: false, reason: "word-mismatch" };
            }
        }

        const acrossRuns = extractRuns(testGrid, size, "across");
        const downRuns = extractRuns(testGrid, size, "down");
        const acrossPlacements = currentPlacements.filter((item) => item.direction === "across");
        const downPlacements = currentPlacements.filter((item) => item.direction === "down");

        if (acrossRuns.length !== acrossPlacements.length) {
            return { valid: false, reason: "across-run-count" };
        }
        if (downRuns.length !== downPlacements.length) {
            return { valid: false, reason: "down-run-count" };
        }

        function matchRuns(runs, list) {
            const used = new Set();
            for (const run of runs) {
                const matchIndex = list.findIndex((placement, index) => {
                    if (used.has(index)) {
                        return false;
                    }
                    return (
                        placement.row === run.row &&
                        placement.col === run.col &&
                        normalizeAnswer(placement.word.answer) === run.text
                    );
                });
                if (matchIndex === -1) {
                    return false;
                }
                used.add(matchIndex);
            }
            return true;
        }

        if (!matchRuns(acrossRuns, acrossPlacements)) {
            return { valid: false, reason: "across-run-content" };
        }
        if (!matchRuns(downRuns, downPlacements)) {
            return { valid: false, reason: "down-run-content" };
        }

        // Çapraz hücreler: across + down sahipliği
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = testGrid[row][col];
                if (cell.letter === null || cell.words.length < 2) {
                    continue;
                }
                const dirs = new Set(
                    cell.words.map((wordId) => {
                        const placement = currentPlacements.find((item) => item.word.id === wordId);
                        return placement ? placement.direction : null;
                    })
                );
                if (dirs.has("across") && dirs.has("down") && dirs.size > 2) {
                    return { valid: false, reason: "too-many-words" };
                }
            }
        }

        return { valid: true, reason: "ok" };
    }

    function generateCrossword(wordList, size) {
        if (!wordList || wordList.length === 0) {
            return [];
        }

        const remainingWords = wordList.map((word) => ({
            id: word.id,
            answer: normalizeAnswer(word.answer),
            clue: word.clue || word.question || "",
            question: word.clue || word.question || "",
            language: word.language || "EN"
        }));

        // En uzun kelimeyi ilk yerleştir — daha dengeli grid
        remainingWords.sort(
            (a, b) => normalizeAnswer(b.answer).length - normalizeAnswer(a.answer).length
        );

        const firstWord = remainingWords.shift();
        const firstAnswer = normalizeAnswer(firstWord.answer);
        const initialPlacement = {
            word: firstWord,
            row: Math.floor(size / 2),
            col: Math.floor((size - firstAnswer.length) / 2),
            direction: "across"
        };

        const result = backtrackPlacement([initialPlacement], remainingWords, size);
        if (!result) {
            return [];
        }

        const validation = validateCrossword(result, size);
        if (!validation.valid) {
            console.warn("Generated crossword failed validation:", validation.reason);
            return [];
        }

        return result;
    }

    function assignNumbers(currentPlacements) {
        const sorted = [...currentPlacements].sort((a, b) => {
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            return a.col - b.col;
        });

        const numberMap = new Map();
        let nextNumber = 1;

        for (const placement of sorted) {
            const key = `${placement.row},${placement.col}`;
            if (!numberMap.has(key)) {
                numberMap.set(key, nextNumber);
                nextNumber += 1;
            }
            placement.number = numberMap.get(key);
        }
    }

    function buildFinalGrid(currentPlacements, size) {
        const finalGrid = createEmptyGrid(size);
        for (const placement of currentPlacements) {
            const cells = getWordCells(
                placement.word,
                placement.row,
                placement.col,
                placement.direction
            );
            for (const cell of cells) {
                const gridCell = finalGrid[cell.row][cell.col];
                gridCell.letter = cell.letter;
                if (!gridCell.words.includes(placement.word.id)) {
                    gridCell.words.push(placement.word.id);
                }
            }
            finalGrid[placement.row][placement.col].number = placement.number;
        }
        return finalGrid;
    }

    function getGridBounds(currentGrid, size) {
        let minRow = size;
        let maxRow = -1;
        let minCol = size;
        let maxCol = -1;

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (currentGrid[row][col].letter !== null) {
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }

        if (maxRow < 0) {
            return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
        }

        return { minRow, maxRow, minCol, maxCol };
    }

    function getPlacementCells(placement) {
        return getWordCells(
            placement.word,
            placement.row,
            placement.col,
            placement.direction
        );
    }

    function getCellSize() {
        const width = window.innerWidth;
        if (width <= 380) {
            return 30;
        }
        if (width <= 480) {
            return 34;
        }
        if (width <= 768) {
            return 40;
        }
        return 46;
    }

    /* -----------------------------------------------------
       UI HELPERS / SCREENS
    ----------------------------------------------------- */

    function showScreen(screen) {
        homeScreen.classList.toggle("active", screen === "home");
        levelsScreen.classList.toggle("active", screen === "levels");
        gameScreen.classList.toggle("active", screen === "game");
        settingsScreen.classList.toggle("active", screen === "settings");
        dictionaryScreen.classList.toggle("active", screen === "dictionary");
        statsScreen.classList.toggle("active", screen === "stats");
        if (screen === "home") {
            stopTimeAttackTimer();
            startHomeMusic();
        } else {
            stopHomeMusic();
        }
    }

    function updateHomeStats() {
        const completed = getCompletedCount();
        const total = getTotalLevelCount();
        homeCompletedText.textContent = `${completed} / ${total}`;
        const lastLevel = getLevelById(progress.lastPlayedLevelId);
        homeLastLevelText.textContent = lastLevel
            ? getLevelDisplayTitle(lastLevel)
            : "—";
        const percent = total === 0 ? 0 : (completed / total) * 100;
        homeProgressFill.style.width = `${percent}%`;
        homeProgressFill.setAttribute("aria-valuenow", String(Math.round(percent)));
        homeProgressText.textContent = `${Math.round(percent)}%`;
        updateStatsUI();
    }

    const LEVEL_CATEGORIES = [
        { key: "easy", label: "Kolay", cefr: "A1", wordCount: 4 },
        { key: "medium", label: "Orta", cefr: "A2", wordCount: 5 },
        { key: "hard", label: "Zor", cefr: "B1", wordCount: 6 },
        { key: "expert", label: "Uzman", cefr: "B2", wordCount: 7 }
    ];

    function getLevelCategoryKey(level) {
        if (level.difficulty === "master") {
            return "expert";
        }
        return LEVEL_CATEGORIES.some((category) => category.key === level.difficulty)
            ? level.difficulty
            : "expert";
    }

    function getTargetWordCount(level) { const category = LEVEL_CATEGORIES.find(item => item.key === getLevelCategoryKey(level)); return category ? category.wordCount : 7; }

    function getPlayableWords(level) { return level.words.slice(0, Math.min(getTargetWordCount(level), level.words.length)); }

    function getLevelDisplayTitle(level) {
        const categoryKey = getLevelCategoryKey(level);
        const category = LEVEL_CATEGORIES.find((item) => item.key === categoryKey);
        const categoryLevels = getActiveLevels().filter(
            (item) => getLevelCategoryKey(item) === categoryKey
        );
        const levelNumber = categoryLevels.findIndex((item) => item.id === level.id) + 1;
        return `${category.label} (${category.cefr}) Seviye ${levelNumber}`;
    }

    function renderLevelsScreen() {
        levelsGrid.replaceChildren();

        LEVEL_CATEGORIES.forEach((category) => {
            const categoryLevels = getActiveLevels().filter(
                (level) => getLevelCategoryKey(level) === category.key
            );
            if (categoryLevels.length === 0) {
                return;
            }

            const section = document.createElement("section");
            section.className = "level-category";
            section.dataset.difficulty = category.key;

            const heading = document.createElement("h3");
            heading.className = "level-category-title";
            heading.textContent = `${category.label} (${category.cefr})`;

            const categoryGrid = document.createElement("div");
            categoryGrid.className = "level-category-grid";

            categoryLevels.forEach((level) => {
                const entry = progress.levels[level.id];
                const card = document.createElement("button");
                card.type = "button";
                card.className = "level-card";
                card.dataset.status = entry.status;

                let icon = "■";
                if (entry.status === LEVEL_STATUS.COMPLETED) {
                    icon = "✓";
                } else if (entry.status === LEVEL_STATUS.IN_PROGRESS) {
                    icon = "▸";
                } else if (entry.status === LEVEL_STATUS.UNLOCKED) {
                    icon = "○";
                }

                const solvedCount = (entry.solvedWordIds || []).length;
                const totalWords = getTargetWordCount(level);
                const meta =
                    entry.status === LEVEL_STATUS.COMPLETED
                        ? "Tamamlandı"
                        : entry.status === LEVEL_STATUS.IN_PROGRESS
                          ? `${solvedCount} / ${totalWords} kelime`
                          : entry.status === LEVEL_STATUS.LOCKED
                            ? "Kilitli"
                            : `${totalWords} kelime`;

                const iconElement = document.createElement("span");
                iconElement.className = "level-card-icon";
                iconElement.setAttribute("aria-hidden", "true");
                iconElement.textContent = icon;

                const titleElement = document.createElement("span");
                titleElement.className = "level-card-title";
                titleElement.textContent = getLevelDisplayTitle(level);

                const metaElement = document.createElement("span");
                metaElement.className = "level-card-meta";
                metaElement.textContent = meta;

                card.append(iconElement, titleElement, metaElement);

                if (entry.status !== LEVEL_STATUS.LOCKED) {
                    card.addEventListener("click", () => startLevel(level.id));
                } else {
                    card.disabled = true;
                }

                categoryGrid.appendChild(card);
            });

            section.append(heading, categoryGrid);
            levelsGrid.appendChild(section);
        });
    }

    function updateProgressUI() {
        const solved = solvedWords.size;
        const total = placements.length;
        progressText.textContent = `${solved} / ${total}`;
        const percentage = total === 0 ? 0 : (solved / total) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    /* -----------------------------------------------------
       RENDER GRID / CLUES
    ----------------------------------------------------- */

    function renderGrid() {
        puzzleElement.innerHTML = "";
        const bounds = getGridBounds(grid, gridSize);
        const rowCount = bounds.maxRow - bounds.minRow + 1;
        const colCount = bounds.maxCol - bounds.minCol + 1;
        const cellSize = getCellSize();

        puzzleElement.style.gridTemplateColumns = `repeat(${colCount}, ${cellSize}px)`;
        puzzleElement.style.setProperty("--cell-size", `${cellSize}px`);

        for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
            for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
                const cell = grid[row][col];
                const cellElement = document.createElement("div");
                cellElement.classList.add("cell");
                cellElement.style.width = `${cellSize}px`;
                cellElement.style.height = `${cellSize}px`;

                if (cell.letter === null) {
                    cellElement.classList.add("black");
                } else {
                    if (
                        selectedCell &&
                        selectedCell.row === row &&
                        selectedCell.col === col
                    ) {
                        cellElement.classList.add("selected");
                    }

                    if (
                        selectedCell &&
                        cell.words.includes(selectedCell.wordId)
                    ) {
                        cellElement.classList.add("word-selected");
                    }

                    const cellSolved = cell.words.some((wordId) =>
                        solvedWords.has(wordId)
                    );
                    if (cellSolved) {
                        cellElement.classList.add("solved");
                    }

                    if (cell.number !== null) {
                        const numberElement = document.createElement("span");
                        numberElement.classList.add("cell-number");
                        numberElement.textContent = cell.number;
                        cellElement.appendChild(numberElement);
                    }

                    const letterElement = document.createElement("span");
                    letterElement.classList.add("cell-letter");
                    if (cell.userLetter !== "") {
                        letterElement.textContent = cell.userLetter;
                    }
                    cellElement.appendChild(letterElement);

                    cellElement.addEventListener("click", () => {
                        handleCellClick(row, col);
                    });
                }

                puzzleElement.appendChild(cellElement);
            }
        }
    }

    function renderClues() {
        acrossCluesElement.innerHTML = "";
        downCluesElement.innerHTML = "";

        const sorted = [...placements].sort((a, b) => a.number - b.number);

        for (const placement of sorted) {
            const clue = document.createElement("button");
            clue.type = "button";
            clue.classList.add("clue");
            clue.dataset.wordId = placement.word.id;

            const isSolved = solvedWords.has(placement.word.id);
            const hasWrong = Boolean(wrongAttempts[placement.word.id]);

            if (isSolved) {
                clue.classList.add("solved");
            }
            if (hasWrong && !isSolved) {
                clue.classList.add("wrong");
            }
            if (selectedCell && selectedCell.wordId === placement.word.id) {
                clue.classList.add("active");
            }

            clue.innerHTML = `
                <span class="clue-number">${placement.number}.</span>
                <span class="clue-text">${placement.word.question}</span>
            `;

            clue.addEventListener("click", () => {
                selectWord(placement.word.id, placement.row, placement.col);
                if (!solvedWords.has(placement.word.id)) {
                    openWord(placement.word.id);
                }
            });

            if (placement.direction === "across") {
                acrossCluesElement.appendChild(clue);
            } else {
                downCluesElement.appendChild(clue);
            }
        }
    }

    /* -----------------------------------------------------
       SELECTION / INPUT
    ----------------------------------------------------- */

    function preferDirectionOrder(wordIds, preferredDirection) {
        if (!preferredDirection || wordIds.length < 2) {
            return wordIds;
        }
        return [...wordIds].sort((a, b) => {
            const pa = placements.find((item) => item.word.id === a);
            const pb = placements.find((item) => item.word.id === b);
            const da = pa ? pa.direction : "";
            const db = pb ? pb.direction : "";
            if (da === preferredDirection && db !== preferredDirection) {
                return -1;
            }
            if (db === preferredDirection && da !== preferredDirection) {
                return 1;
            }
            return 0;
        });
    }

    function handleCellClick(row, col) {
        const cell = grid[row][col];
        if (cell.words.length === 0) {
            return;
        }

        let wordIds = [...cell.words];

        if (
            selectedCell &&
            selectedCell.row === row &&
            selectedCell.col === col &&
            wordIds.length > 1
        ) {
            const ordered = preferDirectionOrder(
                wordIds,
                selectedCell &&
                    placements.find((item) => item.word.id === selectedCell.wordId)
                    ? placements.find((item) => item.word.id === selectedCell.wordId)
                          .direction === "across"
                        ? "down"
                        : "across"
                    : "across"
            );
            const currentIndex = ordered.indexOf(selectedCell.wordId);
            const nextWordId = ordered[(currentIndex + 1) % ordered.length];
            selectWord(nextWordId, row, col);
            if (!solvedWords.has(nextWordId)) {
                openWord(nextWordId);
            }
            return;
        }

        wordIds = preferDirectionOrder(wordIds, "across");
        let selectedWordId = wordIds.find((wordId) => !solvedWords.has(wordId));
        if (!selectedWordId) {
            selectedWordId = wordIds[0];
        }

        selectWord(selectedWordId, row, col);
        if (!solvedWords.has(selectedWordId)) {
            openWord(selectedWordId);
        }
    }

    function selectWord(wordId, row, col) {
        const placement = placements.find((item) => item.word.id === wordId);
        if (!placement) {
            return;
        }

        selectedCell = { row, col, wordId };
        renderGrid();
        renderClues();
    }

    function openWord(wordId) {
        if (answerBusy) {
            return;
        }

        const placement = placements.find((item) => item.word.id === wordId);
        if (!placement || solvedWords.has(wordId)) {
            return;
        }

        currentWord = placement;
        modalBox.classList.remove("shake", "error-flash");
        modalNumber.textContent = `${placement.number} ${
            placement.direction === "across" ? "YATAY" : "DİKEY"
        }`;
        modalQuestion.textContent = placement.word.question;
        const answerLength = normalizeAnswer(placement.word.answer).length;
        modalLength.textContent = `${answerLength} harf`;
        modalLength.setAttribute("aria-label", `Cevap uzunluğu: ${answerLength} harf`);
        answerInput.value = "";
        answerInput.maxLength = answerLength;
        answerInput.setAttribute("maxlength", String(answerLength));
        resultMessage.textContent = "";
        resultMessage.className = "result-message";
        answerModal.classList.add("show");

        setTimeout(() => {
            answerInput.focus();
        }, 120);
    }

    function closeAnswerModal() {
        answerModal.classList.remove("show");
        currentWord = null;
        answerBusy = false;
    }

    function checkAnswer() {
        if (!currentWord || answerBusy) {
            return;
        }

        const userAnswer = normalizeAnswer(answerInput.value);
        if (!userAnswer) {
            resultMessage.textContent = "Lütfen bir cevap yazın.";
            resultMessage.className = "result-message is-error";
            return;
        }

        const correctAnswer = normalizeAnswer(currentWord.word.answer);

        if (userAnswer === correctAnswer) {
            answerBusy = true;
            solvedWords.add(currentWord.word.id);
            recordCorrectWord(currentWord.word.id);
            if (gameMode === "timeAttack") { timeAttackWords += 1; timeAttackRemainingMs = Math.min(120000, timeAttackRemainingMs + 10000); timeAttackScore += 100 + (normalizeAnswer(currentWord.word.answer).length * 20) + (answerStreak * 10); updateTimeAttackUI(); }
            if (gameMode === "extreme") updateExtremeUI();
            resultMessage.textContent = "✓ Doğru cevap!";
            resultMessage.className = "result-message is-success";
            playSoundEffect("correct");
            persistLevelState();
            revealWordAnimated(currentWord);
            return;
        }

        // Yanlış cevap
        const wordId = currentWord.word.id;
        if (!wrongAttempts[wordId]) {
            wrongAttempts[wordId] = { count: 0, lastAnswer: "" };
        }
        wrongAttempts[wordId].count += 1;
        wrongAttempts[wordId].lastAnswer = userAnswer;
        wrongTotal += 1;
        recordWrongWord();
        if (gameMode === "extreme") { lives = Math.max(0, lives - 1); updateExtremeUI(); }
        if (gameMode === "timeAttack") { timeAttackRemainingMs = Math.max(0, timeAttackRemainingMs - 3000); timeAttackScore = Math.max(0, timeAttackScore - 25); updateTimeAttackUI(); if (timeAttackRemainingMs === 0) { showTimeAttackEndModal(false); return; } }

        resultMessage.textContent = "Yanlış cevap.";
        resultMessage.className = "result-message is-error";
        playSoundEffect("wrong");
        modalBox.classList.remove("shake", "error-flash");
        void modalBox.offsetWidth;
        modalBox.classList.add("shake", "error-flash");

        renderClues();
        persistLevelState();

        answerBusy = false;
    }

    function useHint() {
        if (!currentWord) {
            return;
        }
        if (gameMode === "extreme" && lives <= 0) {
            resultMessage.textContent = "Canın kalmadığı için ipucu kullanamazsın.";
            resultMessage.className = "result-message is-error";
            return;
        }
        const placement = currentWord;
        if (!placement || solvedWords.has(placement.word.id)) {
            return;
        }

        const answer = normalizeAnswer(placement.word.answer);
        const firstLetter = answer[0];
        hintsUsed += 1;
        recordHintUsed();
        if (gameMode === "timeAttack") { timeAttackRemainingMs = Math.max(0, timeAttackRemainingMs - 5000); updateTimeAttackUI(); }
        answerInput.value = firstLetter;
        resultMessage.textContent = `İpucu: ilk harf "${firstLetter}"`;
        resultMessage.className = "result-message is-hint";
        playSoundEffect("hint");
        persistLevelState();
    }

    /* -----------------------------------------------------
       REVEAL / COMPLETE
    ----------------------------------------------------- */

    function getGridCellElement(row, col) { const cells=puzzleElement.querySelectorAll(".cell"); const bounds=getGridBounds(grid,gridSize); const localRow=row-bounds.minRow, localCol=col-bounds.minCol, columnCount=bounds.maxCol-bounds.minCol+1; return cells[localRow*columnCount+localCol] || null; }

    function animateCell(row, col) {
        const cells = puzzleElement.querySelectorAll(".cell");
        const bounds = getGridBounds(grid, gridSize);
        const localRow = row - bounds.minRow;
        const localCol = col - bounds.minCol;
        const columnCount = bounds.maxCol - bounds.minCol + 1;
        const index = localRow * columnCount + localCol;
        const cellElement = cells[index];
        if (!cellElement) {
            return;
        }
        cellElement.classList.remove("letter-reveal");
        void cellElement.offsetWidth;
        cellElement.classList.add("letter-reveal");
    }

    function revealWordAnimated(placement) {
        const cells = getPlacementCells(placement);

        cells.forEach((cell) => {
            grid[cell.row][cell.col].userLetter = cell.letter;
        });

        renderGrid();
        renderClues();

        cells.forEach((cell, index) => { setTimeout(() => { const el=getGridCellElement(cell.row,cell.col); if(el){el.classList.add("correct-burst"); setTimeout(()=>el.classList.remove("correct-burst"),520);} animateCell(cell.row,cell.col); }, index * 85); });
        puzzleElement.classList.remove("puzzle-success-pulse"); void puzzleElement.offsetWidth; puzzleElement.classList.add("puzzle-success-pulse"); setTimeout(()=>puzzleElement.classList.remove("puzzle-success-pulse"),650);

        const animationDuration = (cells.length - 1) * 70 + 420;

        setTimeout(() => {
            closeAnswerModal();
            updateProgressUI();
            renderClues();
            persistLevelState();

            if (solvedWords.size === placements.length) {
                setTimeout(showCompleteModal, 280);
            }
        }, animationDuration);
    }

    function formatTime(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    function showCompleteModal() {
        replayMode = false;
        if (gameMode === "timeAttack") { stats.puzzlesCompleted += 1; stats.totalPlayTimeMs += Math.max(0,Date.now()-levelStartedAt); saveLearningStats(); showTimeAttackEndModal(true); return; }
        const elapsed = Date.now() - levelStartedAt;
        const levelEntry = progress.levels[currentLevelId];
        levelEntry.status = LEVEL_STATUS.COMPLETED;
        levelEntry.solvedWordIds = [...solvedWords];
        levelEntry.wrongAttempts = wrongAttempts;
        levelEntry.hintsUsed = hintsUsed;
        levelEntry.wrongTotal = wrongTotal;
        levelEntry.placements = serializePlacements(placements);
        if (
            levelEntry.bestTimeMs === null ||
            elapsed < levelEntry.bestTimeMs
        ) {
            levelEntry.bestTimeMs = elapsed;
        }

        const nextId = getNextLevelId();
        if (nextId !== null) {
            unlockLevel(nextId);
        }
        saveProgress();
        stats.puzzlesCompleted += 1;
        stats.totalPlayTimeMs += elapsed;
        saveLearningStats();
        updateHomeStats();
        updateStatsUI();

        completeTitle.textContent = `${getLevelDisplayTitle(getLevelById(currentLevelId))} tamamlandı!`;
        completeStats.innerHTML = `
            <div class="stat-row"><span>Mod</span><strong>${getModeLabel(gameMode)}</strong></div>
            <div class="stat-row"><span>Çözülen kelime</span><strong>${placements.length}</strong></div>
            <div class="stat-row"><span>Yanlış cevap</span><strong>${wrongTotal}</strong></div>
            <div class="stat-row"><span>İpucu</span><strong>${hintsUsed}</strong></div>
        `;

        if (nextId !== null) {
            nextLevelButton.style.display = "";
            nextLevelButton.textContent = "Sonraki Seviye";
        } else {
            nextLevelButton.style.display = "none";
        }

        completeModal.classList.add("show");
        completeModal.classList.add("celebrate");
        playSoundEffect("complete");
    }

    /* -----------------------------------------------------
       PERSISTENCE OF ACTIVE LEVEL
    ----------------------------------------------------- */

    function serializePlacements(list) {
        return list.map((placement) => ({
            wordId: placement.word.id,
            row: placement.row,
            col: placement.col,
            direction: placement.direction,
            number: placement.number
        }));
    }

    function restorePlacements(level, saved) {
        const map = new Map(level.words.map((word) => [word.id, word]));
        const restored = [];
        for (const item of saved) {
            const source = map.get(item.wordId);
            if (!source) {
                return null;
            }
            restored.push({
                word: {
                    id: source.id,
                    answer: normalizeAnswer(source.answer),
                    clue: source.clue,
                    question: source.clue,
                    language: source.language || "EN"
                },
                row: item.row,
                col: item.col,
                direction: item.direction,
                number: item.number
            });
        }
        return restored;
    }

    function persistLevelState() {
        if (replayMode) return;
        const entry = progress.levels[currentLevelId];
        if (!entry) {
            return;
        }
        if (entry.status !== LEVEL_STATUS.COMPLETED) {
            entry.status =
                solvedWords.size > 0
                    ? LEVEL_STATUS.IN_PROGRESS
                    : LEVEL_STATUS.UNLOCKED;
        }
        entry.solvedWordIds = [...solvedWords];
        entry.wrongAttempts = wrongAttempts;
        entry.hintsUsed = hintsUsed;
        entry.wrongTotal = wrongTotal;
        entry.placements = serializePlacements(placements);
        entry.lastPlayedAt = Date.now();
        progress.currentLevelId = currentLevelId;
        progress.lastPlayedLevelId = currentLevelId;
        saveProgress();
    }

    function applySolvedLetters() {
        for (const placement of placements) {
            if (!solvedWords.has(placement.word.id)) {
                continue;
            }
            const cells = getPlacementCells(placement);
            cells.forEach((cell) => {
                grid[cell.row][cell.col].userLetter = cell.letter;
            });
        }
    }

    /* -----------------------------------------------------
       LEVEL START
    ----------------------------------------------------- */

    function startLevel(levelId, options) {
        const level = getLevelById(levelId);
        if (!level) return;
        const entry = progress.levels[levelId];
        if (!entry || entry.status === LEVEL_STATUS.LOCKED) return;
        if (entry.status === LEVEL_STATUS.COMPLETED && !(options && options.replay) && !(options && options.showAnswers)) {
            pendingCompletedLevelId = levelId;
            completedLevelModal.classList.add("show");
            return;
        }
        replayMode = Boolean(options && options.replay);
        if (options && options.mode) activateMode(options.mode);
        if (options && options.timeAttack) { gameMode="timeAttack"; timeAttackRemainingMs=90000; }
        lives = gameMode === "extreme" ? 3 : 3;
        const showAnswersMode = Boolean(options && options.showAnswers);
        currentLevelId = levelId;
        gridSize = level.gridSize || 15;
        selectedCell = null; currentWord = null; answerBusy = false;
        hintsUsed = replayMode ? 0 : (entry.hintsUsed || 0);
        wrongTotal = replayMode ? 0 : (entry.wrongTotal || 0);
        wrongAttempts = replayMode ? {} : Object.assign({}, entry.wrongAttempts || {});
        solvedWords = replayMode
            ? new Set()
            : showAnswersMode
                ? new Set(level.words.map(word => word.id))
                : new Set(entry.solvedWordIds || []);
        levelStartedAt = Date.now();
        levelTitleEl.textContent = getLevelDisplayTitle(level);
        const forceNew = Boolean(options && options.forceNew);
        const useSavedCompletedLayout = showAnswersMode && entry.status === LEVEL_STATUS.COMPLETED && entry.placements && entry.placements.length;
        const activeWords = useSavedCompletedLayout
            ? level.words
            : getPlayableWords(level);
        let generated = null;
        if (!forceNew && !replayMode && entry.placements && entry.placements.length) {
            generated = restorePlacements(level, entry.placements);
            if (generated && generated.length !== activeWords.length) generated = null;
            if (generated && !validateCrossword(generated, gridSize).valid) generated = null;
        }
        if (!generated) {
            const attempts = 8;
            for (let i = 0; i < attempts; i++) {
                const words = activeWords.map(word => Object.assign({}, word));
                if (i > 0) {
                    for (let j = words.length - 1; j > 0; j--) {
                        const k = Math.floor(Math.random() * (j + 1));
                        [words[j], words[k]] = [words[k], words[j]];
                    }
                }
                generated = generateCrossword(words, gridSize);
                if (generated.length === activeWords.length) break;
                generated = null;
            }
        }
        if (!generated || generated.length === 0) {
            alert("Bu seviye için bulmaca oluşturulamadı. Lütfen tekrar deneyin.");
            return;
        }
        placements = generated;
        assignNumbers(placements);
        grid = buildFinalGrid(placements, gridSize);
        applySolvedLetters();
        if (!replayMode) {
            entry.status = solvedWords.size === activeWords.length ? LEVEL_STATUS.COMPLETED : solvedWords.size > 0 ? LEVEL_STATUS.IN_PROGRESS : LEVEL_STATUS.UNLOCKED;
            persistLevelState();
        }
        showScreen("game");
        renderGrid(); renderClues(); updateProgressUI();
        const hud=document.getElementById("timeAttackHud"); if(hud){hud.hidden=gameMode!=="timeAttack"; updateTimeAttackUI();}
        if(gameMode==="timeAttack") startTimeAttackTimer(); else stopTimeAttackTimer();
        updateExtremeUI();
        completeModal.classList.remove("show", "celebrate");
        completedLevelModal.classList.remove("show");
        closeAnswerModal();
    }
    function saveSettings() { try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch (error) {} }
    function setCluesSheetOpen(open) {
        const isOpen = Boolean(open) && Boolean(settings.collapsibleClues);
        cluesCard.classList.toggle("is-sheet-open", isOpen);
        cluesCard.classList.toggle("is-collapsed", !isOpen);
        cluesSheetBackdrop.classList.toggle("is-visible", isOpen);
        cluePanelHandle.setAttribute("aria-expanded", String(isOpen));
        cluesSheetBackdrop.setAttribute("aria-hidden", String(!isOpen));
    }

    function applySettingsUI() {
        const enabled = Boolean(settings.collapsibleClues);
        document.body.classList.toggle("collapsible-clues-enabled", enabled);
        settingsSoundToggle.checked = soundEnabled;
        settingsCollapsibleClues.checked = enabled;
        if (!enabled) {
            cluesCard.classList.remove("is-sheet-open", "is-collapsed");
            cluesSheetBackdrop.classList.remove("is-visible");
            cluesSheetBackdrop.setAttribute("aria-hidden", "true");
            cluePanelHandle.setAttribute("aria-expanded", "false");
        } else {
            setCluesSheetOpen(false);
        }
    }
    function openSettings() { applySettingsUI(); showScreen("settings"); }
    function getSolvedDictionaryWords() {
        const rows = []; getActiveLevels().forEach(level => { const solved = new Set(progress.levels[level.id]?.solvedWordIds || []); level.words.forEach(word => { if (solved.has(word.id)) rows.push({word,level}); }); }); return rows;
    }
    function renderDictionary() {
        const lv=dictionaryLevelFilter.value, diff=dictionaryDifficultyFilter.value, q=(dictionarySearch.value||"").trim().toLowerCase();
        const rows=getSolvedDictionaryWords().filter(({word,level})=>(lv==="all"||String(level.id)===lv)&&(diff==="all"||getLevelCategoryKey(level)===diff)&&(!q||word.answer.toLowerCase().includes(q)||word.clue.toLowerCase().includes(q)));
        dictionaryList.replaceChildren(); dictionaryEmpty.style.display=rows.length?"none":"block";
        rows.forEach(({word,level})=>{const card=document.createElement("article");card.className="dictionary-card";const cat=LEVEL_CATEGORIES.find(c=>c.key===getLevelCategoryKey(level));card.innerHTML="<div class=\"dictionary-word\">"+word.answer+"</div><div class=\"dictionary-clue\">"+word.clue+"</div><div class=\"dictionary-meta\">"+getLevelDisplayTitle(level)+" · "+(cat?cat.label:"Uzman")+"</div>";dictionaryList.appendChild(card);});
    }
    function openDictionary() {
        dictionaryLevelFilter.innerHTML="<option value=\"all\">Tüm seviyeler</option>";
        getActiveLevels().forEach(level=>{const o=document.createElement("option");o.value=String(level.id);o.textContent=getLevelDisplayTitle(level);dictionaryLevelFilter.appendChild(o);});
        dictionaryDifficultyFilter.innerHTML="<option value=\"all\">Tüm zorluklar</option>";
        LEVEL_CATEGORIES.forEach(c=>{const o=document.createElement("option");o.value=c.key;o.textContent=c.label;dictionaryDifficultyFilter.appendChild(o);});
        renderDictionary(); showScreen("dictionary");
    }
    function continueFromHome() {
        activateMode(gameMode);
        const levels = getActiveLevels();
        const target = progress.lastPlayedLevelId || progress.currentLevelId || levels[0]?.id;
        const entry = progress.levels[target];
        if (entry && entry.status !== LEVEL_STATUS.LOCKED) {
            startLevel(target);
            return;
        }
        if (levels[0]) startLevel(levels[0].id);
    }

    function openModeSelector() {
        document.getElementById("modeSelectorModal")?.classList.add("show");
    }

    /* -----------------------------------------------------
       EVENTS
    ----------------------------------------------------- */

    document.addEventListener(
        "pointerdown",
        () => {
            if (soundEnabled) {
                void unlockAudio();
            }
        },
        { once: true, capture: true }
    );

    document.getElementById("openTimeAttackButton")?.addEventListener("click", () => openModeSelector());
    document.getElementById("openStatsButton")?.addEventListener("click", () => { selectStatsMode(gameMode); showScreen("stats"); });
    document.getElementById("backHomeFromStats")?.addEventListener("click", () => showScreen("home"));
    document.getElementById("timeAttackNewRoundButton")?.addEventListener("click", () => { document.getElementById("timeAttackModal")?.classList.remove("show"); beginTimeAttackRound(); });
    document.getElementById("timeAttackExitButton")?.addEventListener("click", () => { document.getElementById("timeAttackModal")?.classList.remove("show"); gameMode="normal"; showScreen("home"); });
    document.getElementById("openSettingsButton").addEventListener("click", openSettings);
    document.getElementById("openDictionaryButton").addEventListener("click", openDictionary);
    document.getElementById("backHomeFromSettings").addEventListener("click", () => showScreen("home"));
    document.getElementById("backHomeFromDictionary").addEventListener("click", () => showScreen("home"));
    settingsSoundToggle.addEventListener("change", () => setSoundEnabled(settingsSoundToggle.checked));
    settingsCollapsibleClues.addEventListener("change", () => {
        settings.collapsibleClues = settingsCollapsibleClues.checked;
        saveSettings();
        applySettingsUI();
    });
    dictionaryLevelFilter.addEventListener("change", renderDictionary);
    dictionaryDifficultyFilter.addEventListener("change", renderDictionary);
    dictionarySearch.addEventListener("input", renderDictionary);
    document.getElementById("replayLevelButton").addEventListener("click", () => { const id=pendingCompletedLevelId; completedLevelModal.classList.remove("show"); pendingCompletedLevelId=null; if(id) startLevel(id,{replay:true,forceNew:true}); });
    document.getElementById("showAnswersButton").addEventListener("click", () => { const id=pendingCompletedLevelId; completedLevelModal.classList.remove("show"); pendingCompletedLevelId=null; if(id) startLevel(id,{showAnswers:true}); });
    document.getElementById("cancelCompletedLevelButton").addEventListener("click", () => { completedLevelModal.classList.remove("show"); pendingCompletedLevelId=null; });
    let clueDragStartY = null;
    let clueDragMoved = false;
    cluePanelHandle.addEventListener("pointerdown", event => {
        if (!settings.collapsibleClues) return;
        clueDragStartY = event.clientY;
        clueDragMoved = false;
        cluePanelHandle.setPointerCapture?.(event.pointerId);
    });
    cluePanelHandle.addEventListener("pointermove", event => {
        if (!settings.collapsibleClues || clueDragStartY === null) return;
        if (Math.abs(event.clientY - clueDragStartY) > 8) clueDragMoved = true;
    });
    cluePanelHandle.addEventListener("pointerup", event => {
        if (!settings.collapsibleClues || clueDragStartY === null) return;
        const delta = event.clientY - clueDragStartY;
        const wasOpen = cluesCard.classList.contains("is-sheet-open");
        clueDragStartY = null;
        if (Math.abs(delta) > 24) {
            setCluesSheetOpen(delta < 0);
        } else if (!clueDragMoved) {
            setCluesSheetOpen(!wasOpen);
        }
        clueDragMoved = false;
    });
    cluePanelHandle.addEventListener("keydown", event => {
        if (!settings.collapsibleClues || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        setCluesSheetOpen(!cluesCard.classList.contains("is-sheet-open"));
    });
    cluesSheetBackdrop.addEventListener("click", () => setCluesSheetOpen(false));
    document.getElementById("startGameButton").addEventListener("click", openModeSelector);
    document.querySelectorAll("[data-mode-select]").forEach(button => button.addEventListener("click", () => { const mode=button.dataset.modeSelect; document.getElementById("modeSelectorModal")?.classList.remove("show"); beginModeRound(mode); }));
    document.getElementById("closeModeSelectorButton")?.addEventListener("click", () => document.getElementById("modeSelectorModal")?.classList.remove("show"));
    document.querySelectorAll("[data-stats-mode]").forEach(button => button.addEventListener("click", () => selectStatsMode(button.dataset.statsMode)));
    document.getElementById("openLevelsButton").addEventListener("click", () => {
        renderLevelsScreen();
        showScreen("levels");
    });
    document.getElementById("backHomeFromLevels").addEventListener("click", () => {
        updateHomeStats();
        showScreen("home");
    });
    document.getElementById("backHomeFromGame").addEventListener("click", () => {
        persistLevelState();
        updateHomeStats();
        showScreen("home");
    });
    document.getElementById("openLevelsFromGame").addEventListener("click", () => {
        persistLevelState();
        renderLevelsScreen();
        showScreen("levels");
    });

    document.getElementById("okButton").addEventListener("click", checkAnswer);
    document.getElementById("cancelButton").addEventListener("click", closeAnswerModal);
    document.getElementById("closeModal").addEventListener("click", closeAnswerModal);

    answerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });

    answerInput.addEventListener("input", () => {
        if (!currentWord) {
            return;
        }

        const maxLength = normalizeAnswer(currentWord.word.answer).length;
        const characters = Array.from(answerInput.value);
        if (characters.length <= maxLength) {
            return;
        }

        const cursorPosition = Math.min(answerInput.selectionStart ?? maxLength, maxLength);
        answerInput.value = characters.slice(0, maxLength).join("");
        answerInput.setSelectionRange(cursorPosition, cursorPosition);
    });

    answerModal.addEventListener("click", (event) => {
        if (event.target === answerModal && !answerBusy) {
            closeAnswerModal();
        }
    });

    hintButton.addEventListener("click", useHint);

    nextLevelButton.addEventListener("click", () => {
        completeModal.classList.remove("show", "celebrate");
        const nextId = currentLevelId + 1;
        if (getLevelById(nextId)) {
            startLevel(nextId, { forceNew: true });
        }
    });

    backToLevelsButton.addEventListener("click", () => {
        completeModal.classList.remove("show", "celebrate");
        renderLevelsScreen();
        showScreen("levels");
    });

    window.addEventListener("resize", () => {
        if (gameScreen.classList.contains("active") && placements.length) {
            renderGrid();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (answerModal.classList.contains("show") && !answerBusy) {
                closeAnswerModal();
            }
        }
    });

    /* -----------------------------------------------------
       BOOT
    ----------------------------------------------------- */

    function boot() {
        // İlk seviye her zaman açık
        const first = getActiveLevels()[0];
        if (first) unlockLevel(first.id);
        saveProgress();
        updateHomeStats();

        showScreen("home");
    }

    setActiveMode("normal");
    applySettingsUI();
    selectStatsMode("normal");
    updateStatsUI();
    boot();
})();
