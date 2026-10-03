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

    const selectedWordLabel = document.getElementById("selectedWordLabel");
    const directionBadge = document.getElementById("directionBadge");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");
    const levelTitleEl = document.getElementById("levelTitle");

    const cluePanelText = document.getElementById("cluePanelText");
    const cluePanelMeta = document.getElementById("cluePanelMeta");
    const cluePanel = document.getElementById("cluePanel");
    const openAnswerButton = document.getElementById("openAnswerButton");
    const hintButton = document.getElementById("hintButton");

    const completeModal = document.getElementById("completeModal");
    const completeStats = document.getElementById("completeStats");
    const completeTitle = document.getElementById("completeTitle");
    const nextLevelButton = document.getElementById("nextLevelButton");
    const backToLevelsButton = document.getElementById("backToLevelsButton");

    const homeCompletedText = document.getElementById("homeCompletedText");
    const homeLastLevelText = document.getElementById("homeLastLevelText");
    const homeProgressFill = document.getElementById("homeProgressFill");

    /* -----------------------------------------------------
       CONSTANTS / STORAGE
    ----------------------------------------------------- */

    const STORAGE_KEY = "kelimeBulmaca.progress.v1";
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
    let solvedWords = new Set();
    let wrongAttempts = {}; // wordId -> { count, lastAnswer }
    let hintsUsed = 0;
    let wrongTotal = 0;
    let levelStartedAt = 0;
    let answerBusy = false;
    let wrongCloseTimer = null;

    /* -----------------------------------------------------
       PROGRESS MANAGER
    ----------------------------------------------------- */

    function createDefaultProgress() {
        const levels = {};
        LEVELS.forEach((level, index) => {
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
        return {
            currentLevelId: 1,
            lastPlayedLevelId: null,
            levels
        };
    }

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return createDefaultProgress();
            }
            const parsed = JSON.parse(raw);
            const base = createDefaultProgress();
            base.currentLevelId = parsed.currentLevelId || 1;
            base.lastPlayedLevelId = parsed.lastPlayedLevelId || null;
            Object.keys(base.levels).forEach((id) => {
                if (parsed.levels && parsed.levels[id]) {
                    base.levels[id] = Object.assign(base.levels[id], parsed.levels[id]);
                }
            });
            return base;
        } catch (error) {
            console.warn("Progress load failed", error);
            return createDefaultProgress();
        }
    }

    let progress = loadProgress();

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.warn("Progress save failed", error);
        }
    }

    function getCompletedCount() {
        return Object.values(progress.levels).filter(
            (item) => item.status === LEVEL_STATUS.COMPLETED
        ).length;
    }

    function unlockLevel(levelId) {
        const entry = progress.levels[levelId];
        if (!entry) {
            return;
        }
        if (entry.status === LEVEL_STATUS.LOCKED) {
            entry.status = LEVEL_STATUS.UNLOCKED;
        }
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
    }

    function updateHomeStats() {
        const completed = getCompletedCount();
        const total = getTotalLevelCount();
        homeCompletedText.textContent = `${completed} / ${total}`;
        homeLastLevelText.textContent = progress.lastPlayedLevelId
            ? String(progress.lastPlayedLevelId)
            : "—";
        const percent = total === 0 ? 0 : (completed / total) * 100;
        homeProgressFill.style.width = `${percent}%`;
    }

    function renderLevelsScreen() {
        levelsGrid.innerHTML = "";
        LEVELS.forEach((level) => {
            const entry = progress.levels[level.id];
            const card = document.createElement("button");
            card.type = "button";
            card.className = "level-card";
            card.dataset.status = entry.status;

            let icon = "🔒";
            if (entry.status === LEVEL_STATUS.COMPLETED) {
                icon = "✓";
            } else if (entry.status === LEVEL_STATUS.IN_PROGRESS) {
                icon = "▸";
            } else if (entry.status === LEVEL_STATUS.UNLOCKED) {
                icon = "○";
            }

            const solvedCount = (entry.solvedWordIds || []).length;
            const totalWords = level.words.length;
            const meta =
                entry.status === LEVEL_STATUS.COMPLETED
                    ? "Tamamlandı"
                    : entry.status === LEVEL_STATUS.IN_PROGRESS
                      ? `${solvedCount} / ${totalWords}`
                      : entry.status === LEVEL_STATUS.LOCKED
                        ? "Kilitli"
                        : level.difficulty;

            card.innerHTML = `
                <span class="level-card-icon">${icon}</span>
                <span class="level-card-title">${level.title}</span>
                <span class="level-card-meta">${meta}</span>
            `;

            if (entry.status !== LEVEL_STATUS.LOCKED) {
                card.addEventListener("click", () => startLevel(level.id));
            } else {
                card.disabled = true;
            }

            levelsGrid.appendChild(card);
        });
    }

    function updateProgressUI() {
        const solved = solvedWords.size;
        const total = placements.length;
        progressText.textContent = `${solved} / ${total}`;
        const percentage = total === 0 ? 0 : (solved / total) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    function updateSelectedWordUI() {
        if (!selectedCell) {
            selectedWordLabel.textContent = "Bir kelime seç";
            directionBadge.textContent = "—";
            cluePanelText.textContent = "Bir açıklama veya hücre seçin";
            cluePanelText.classList.remove("is-wrong", "is-solved");
            cluePanelMeta.textContent = "";
            return;
        }

        const placement = placements.find(
            (item) => item.word.id === selectedCell.wordId
        );
        if (!placement) {
            return;
        }

        const answerLen = normalizeAnswer(placement.word.answer).length;
        const directionLabel =
            placement.direction === "across" ? "Yatay" : "Dikey";
        const isSolved = solvedWords.has(placement.word.id);
        const hasWrong = Boolean(wrongAttempts[placement.word.id]);

        selectedWordLabel.textContent = `${placement.number}. ${placement.word.question}`;
        directionBadge.textContent =
            placement.direction === "across" ? "YATAY" : "DİKEY";

        cluePanelText.textContent = isSolved
            ? `✓ ${placement.word.question}`
            : placement.word.question;
        cluePanelText.classList.toggle("is-wrong", hasWrong && !isSolved);
        cluePanelText.classList.toggle("is-solved", isSolved);
        cluePanelMeta.textContent = `${directionLabel} · ${answerLen} harf${
            hasWrong && !isSolved
                ? ` · ${wrongAttempts[placement.word.id].count} yanlış deneme`
                : ""
        }`;
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
        updateSelectedWordUI();
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

        if (wrongCloseTimer) {
            clearTimeout(wrongCloseTimer);
            wrongCloseTimer = null;
        }

        currentWord = placement;
        modalBox.classList.remove("shake", "error-flash");
        modalNumber.textContent = `${placement.number} ${
            placement.direction === "across" ? "YATAY" : "DİKEY"
        }`;
        modalQuestion.textContent = placement.word.question;
        modalLength.textContent = `${normalizeAnswer(placement.word.answer).length} harf`;
        answerInput.value = "";
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
        if (wrongCloseTimer) {
            clearTimeout(wrongCloseTimer);
            wrongCloseTimer = null;
        }
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
            resultMessage.textContent = "✓ Doğru cevap!";
            resultMessage.className = "result-message is-success";
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

        resultMessage.textContent = "Yanlış cevap.";
        resultMessage.className = "result-message is-error";
        modalBox.classList.remove("shake", "error-flash");
        void modalBox.offsetWidth;
        modalBox.classList.add("shake", "error-flash");

        updateSelectedWordUI();
        renderClues();
        persistLevelState();

        answerBusy = true;
        wrongCloseTimer = setTimeout(() => {
            closeAnswerModal();
            answerBusy = false;
        }, 850);
    }

    function useHint() {
        if (!selectedCell) {
            return;
        }
        const placement = placements.find(
            (item) => item.word.id === selectedCell.wordId
        );
        if (!placement || solvedWords.has(placement.word.id)) {
            return;
        }

        const answer = normalizeAnswer(placement.word.answer);
        const firstLetter = answer[0];
        hintsUsed += 1;
        openWord(placement.word.id);
        answerInput.value = firstLetter;
        resultMessage.textContent = `İpucu: ilk harf "${firstLetter}"`;
        resultMessage.className = "result-message is-hint";
        persistLevelState();
    }

    /* -----------------------------------------------------
       REVEAL / COMPLETE
    ----------------------------------------------------- */

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
        updateSelectedWordUI();
        renderClues();

        cells.forEach((cell, index) => {
            setTimeout(() => {
                animateCell(cell.row, cell.col);
            }, index * 70);
        });

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

        const nextId = currentLevelId + 1;
        if (getLevelById(nextId)) {
            unlockLevel(nextId);
        }
        saveProgress();
        updateHomeStats();

        completeTitle.textContent = `${getLevelById(currentLevelId).title} tamamlandı!`;
        completeStats.innerHTML = `
            <div class="stat-row"><span>Süre</span><strong>${formatTime(elapsed)}</strong></div>
            <div class="stat-row"><span>Çözülen kelime</span><strong>${placements.length}</strong></div>
            <div class="stat-row"><span>Yanlış cevap</span><strong>${wrongTotal}</strong></div>
            <div class="stat-row"><span>İpucu</span><strong>${hintsUsed}</strong></div>
        `;

        if (getLevelById(nextId)) {
            nextLevelButton.style.display = "";
            nextLevelButton.textContent = "Sonraki Seviye";
        } else {
            nextLevelButton.style.display = "none";
        }

        completeModal.classList.add("show");
        completeModal.classList.add("celebrate");
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
        if (!level) {
            return;
        }

        const entry = progress.levels[levelId];
        if (!entry || entry.status === LEVEL_STATUS.LOCKED) {
            return;
        }

        currentLevelId = levelId;
        gridSize = level.gridSize || 15;
        selectedCell = null;
        currentWord = null;
        answerBusy = false;
        hintsUsed = entry.hintsUsed || 0;
        wrongTotal = entry.wrongTotal || 0;
        wrongAttempts = Object.assign({}, entry.wrongAttempts || {});
        solvedWords = new Set(entry.solvedWordIds || []);
        levelStartedAt = Date.now();
        levelTitleEl.textContent = level.title;

        let generated = null;
        const forceNew = options && options.forceNew;

        if (!forceNew && entry.placements && entry.placements.length) {
            generated = restorePlacements(level, entry.placements);
            if (generated) {
                const validation = validateCrossword(generated, gridSize);
                if (!validation.valid) {
                    generated = null;
                }
            }
        }

        if (!generated) {
            // Birkaç deneme — kelime sırası shuffle ile
            const attempts = 8;
            for (let i = 0; i < attempts; i++) {
                const words = level.words.map((word) => Object.assign({}, word));
                if (i > 0) {
                    for (let j = words.length - 1; j > 0; j--) {
                        const k = Math.floor(Math.random() * (j + 1));
                        const tmp = words[j];
                        words[j] = words[k];
                        words[k] = tmp;
                    }
                }
                generated = generateCrossword(words, gridSize);
                if (generated.length === level.words.length) {
                    break;
                }
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

        if (entry.status !== LEVEL_STATUS.COMPLETED) {
            entry.status =
                solvedWords.size > 0
                    ? LEVEL_STATUS.IN_PROGRESS
                    : LEVEL_STATUS.UNLOCKED;
        }
        persistLevelState();

        showScreen("game");
        renderGrid();
        renderClues();
        updateProgressUI();
        updateSelectedWordUI();
        completeModal.classList.remove("show", "celebrate");
        closeAnswerModal();
    }

    function continueFromHome() {
        const target =
            progress.lastPlayedLevelId ||
            progress.currentLevelId ||
            1;
        const entry = progress.levels[target];
        if (entry && entry.status !== LEVEL_STATUS.LOCKED) {
            startLevel(target);
            return;
        }
        startLevel(1);
    }

    /* -----------------------------------------------------
       EVENTS
    ----------------------------------------------------- */

    document.getElementById("startGameButton").addEventListener("click", continueFromHome);
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

    answerModal.addEventListener("click", (event) => {
        if (event.target === answerModal && !answerBusy) {
            closeAnswerModal();
        }
    });

    openAnswerButton.addEventListener("click", () => {
        if (selectedCell && !solvedWords.has(selectedCell.wordId)) {
            openWord(selectedCell.wordId);
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
        unlockLevel(1);
        saveProgress();
        updateHomeStats();
        showScreen("home");
    }

    boot();
})();
