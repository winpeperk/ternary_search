const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const funcTypeInput = document.getElementById("funcType");
const funcInput = document.getElementById("funcInput");
const leftInput = document.getElementById("left");
const rightInput = document.getElementById("right");
const epsInput = document.getElementById("eps");
const startButton = document.querySelector("button");
const stepInfo = document.getElementById("stepInfo");
const result = document.getElementById("result");

let algorithmRunning = false;
let steps = [];
let currentStep = 0;
let timer = null;
let userFunction = null;

function validateInputs() {
    const l = Number(leftInput.value);
    const r = Number(rightInput.value);
    const eps = Number(epsInput.value);

    if (!Number.isFinite(l) || !Number.isFinite(r) || !Number.isFinite(eps) || l >= r || eps <= 0) {
        stepInfo.textContent = "Проверьте границы интервала и точность.";
        result.textContent = "";
        startButton.disabled = true;
        return false;
    }

    if (!createUserFunction()) {
        startButton.disabled = true;
        return false;
    }

    if (!checkUnimodality(l, r)) {
        stepInfo.textContent = "Функция не является унимодальной на заданном интервале.";
        result.textContent = "Измените функцию или границы интервала.";
        startButton.disabled = true;
        return false;
    }

    stepInfo.textContent = "Ожидание запуска алгоритма...";
    result.textContent = "";
    startButton.disabled = false;
    return true;
}

function createUserFunction() {
    try {
        userFunction = new Function("x", `return ${funcInput.value};`);
            const test = userFunction(1);

        if (!Number.isFinite(test)) {
            throw new Error();
        }

        return true;
    } catch {
        stepInfo.textContent = "Ошибка в записи функции.";
        result.textContent = "";
        return false;
    }
}

function f(x) {
    return userFunction(x);
}

function checkUnimodality(l, r) {
    const values = [];
    const pointsCount = 300;

    for (let i = 0; i <= pointsCount; i++) {
        const x = l + (r - l) * i / pointsCount;
        const y = f(x);

        if (!Number.isFinite(y)) {
            return false;
        }

        values.push(y);
    }

    let changes = 0;
    let lastDirection = 0;

    for (let i = 1; i < values.length; i++) {
        const diff = values[i] - values[i - 1];

        if (Math.abs(diff) < 1e-7) {
            continue;
        }

        const currentDirection = diff > 0 ? 1 : -1;

        if (lastDirection !== 0 && currentDirection !== lastDirection) {
            changes++;
        }

        lastDirection = currentDirection;
    }

    return changes <= 1;
}

function handleButtonClick() {
    if (algorithmRunning) {
        resetAlgorithm();
    } else {
        startSearch();
    }
}

function resetAlgorithm() {
    clearInterval(timer);
    algorithmRunning = false;
    steps = [];
    currentStep = 0;

    startButton.innerText = "Запустить";
    stepInfo.textContent = "Ожидание запуска алгоритма...";
    result.textContent = "";

    setInputsDisabled(false);
    drawBaseGraph();
}

function setInputsDisabled(disabled) {
    funcTypeInput.disabled = disabled;
    funcInput.disabled = disabled;
    leftInput.disabled = disabled;
    rightInput.disabled = disabled;
    epsInput.disabled = disabled;
}

function startSearch() {
    clearInterval(timer);

    if (!validateInputs()) {
        drawBaseGraph();
        return;
    }

    let l = Number(leftInput.value);
    let r = Number(rightInput.value);
    const eps = Number(epsInput.value);
    const type = funcTypeInput.value;

    steps = [];
    currentStep = 0;
    algorithmRunning = true;
    startButton.innerText = "Сбросить";
    setInputsDisabled(true);

    stepInfo.textContent = "Троичный поиск начался.";
    result.textContent = "";

    let iteration = 1;

    while (r - l > eps) {
        const m1 = l + (r - l) / 3;
        const m2 = r - (r - l) / 3;

        const f1 = f(m1);
        const f2 = f(m2);

        steps.push({ iteration, l, r, m1, m2, f1, f2 });

        if (type === "max") {
            if (f1 < f2) {
                l = m1;
            } else {
                r = m2;
            }
        } else {
            if (f1 > f2) {
                l = m1;
            } else {
                r = m2;
            }
        }

        iteration++;
    }

    const x = (l + r) / 2;

    steps.push({ iteration, l, r, x, y: f(x), finished: true });

    timer = setInterval(showNextStep, 1500);
}

function showNextStep() {
    if (currentStep >= steps.length) {
        clearInterval(timer);
        return;
    }

    drawStep(steps[currentStep]);
    currentStep++;
}

function drawStep(step) {
    drawBaseGraph();

    if (step.finished) {
        drawVerticalLine(step.x, "#d50040", "x");

        stepInfo.textContent = 
        `Алгоритм завершён. Количество выполненных итераций: ${step.iteration - 1}.`;
        result.textContent =
            `Найден ${
                funcTypeInput.value === "max" ? "максимум" : "минимум"
            }: x ≈ ${step.x.toFixed(4)}, f(x) ≈ ${step.y.toFixed(4)}`;

        return;
    }

    drawVerticalLine(step.l, "gray", "l");
    drawVerticalLine(step.r, "gray", "r");
    drawVerticalLine(step.m1, "#d5006e", "m1");
    drawVerticalLine(step.m2, "#cbb000", "m2");

    stepInfo.textContent =
        `Итерация ${step.iteration}: ` +
        `l = ${step.l.toFixed(3)}, r = ${step.r.toFixed(3)}, ` +
        `m1 = ${step.m1.toFixed(3)}, m2 = ${step.m2.toFixed(3)}`;

    result.textContent =
        `f(m1) = ${step.f1.toFixed(3)}, f(m2) = ${step.f2.toFixed(3)}`;
}

function drawBaseGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!createUserFunction()) {
        startButton.disabled = true;
        return;
    }

    drawAxes();
    drawFunction();

    if (!algorithmRunning) {
        validateInputs();
    }
}

function drawAxes() {
    const xAxisY = mathToScreenY(0);
    const yAxisX = mathToScreenX(0);

    ctx.beginPath();

    ctx.moveTo(60, xAxisY);
    ctx.lineTo(950, xAxisY);

    ctx.moveTo(yAxisX, 40);
    ctx.lineTo(yAxisX, 470);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "20px Cascadia Mono";
    ctx.fillText("x", 960, xAxisY + 5);
    ctx.fillText("y", yAxisX + 8, 45);
}

function drawFunction() {
    ctx.beginPath();

    let isFirstPoint = true;

    for (let px = 60; px <= 950; px++) {
        const x = screenToMathX(px);
        const y = f(x);
        const py = mathToScreenY(y);

        if (!Number.isFinite(y)) {
        isFirstPoint = true;
        continue;
        }

        if (isFirstPoint) {
        ctx.moveTo(px, py);
        isFirstPoint = false;
        } else {
        ctx.lineTo(px, py);
        }
    }

    ctx.strokeStyle = "#674caa";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "20px Cascadia Mono";
    ctx.fillText("f(x)", 650, 120);
}

function drawVerticalLine(x, color, label) {
    const px = mathToScreenX(x);
    const py = mathToScreenY(f(x));
    const xAxisY = mathToScreenY(0);

    ctx.beginPath();
    ctx.setLineDash([6, 6]);

    ctx.moveTo(px, xAxisY);
    if (py < xAxisY) {
        ctx.lineTo(px, py - 10);
    } else {
        ctx.lineTo(px, py + 10);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.font = "20px Cascadia Mono";

    const textX = px - 10;
    let textY;

    if (py < xAxisY) {
        textY = Math.min(xAxisY - 15, py - 25);
    } else {
        textY = Math.max(xAxisY + 25, py + 25);
    }

    textY = Math.max(35, Math.min(490, textY));

    ctx.fillText(label, textX, textY);
}

function drawAxisMark(x, label) {
    const px = mathToScreenX(x);

    ctx.beginPath();
    ctx.moveTo(px, 415);
    ctx.lineTo(px, 425);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "20px Cascadia Mono";
    ctx.fillText(label, px - 5, 445);
}

function getGraphLeft() {
    return Number(leftInput.value);
}

function getGraphRight() {
    return Number(rightInput.value);
}

function mathToScreenX(x) {
    const l = getGraphLeft();
    const r = getGraphRight();

    return 60 + ((x - l) / (r - l)) * 890;
}

function screenToMathX(px) {
    const l = getGraphLeft();
    const r = getGraphRight();

    return l + ((px - 60) / 890) * (r - l);
}

function mathToScreenY(y) {
    const l = Number(leftInput.value);
    const r = Number(rightInput.value);

    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i <= 200; i++) {
        const x = l + (r - l) * i / 200;
        const value = f(x);

        if (Number.isFinite(value)) {
            minY = Math.min(minY, value);
            maxY = Math.max(maxY, value);
        }
    }

    minY = Math.min(minY, 0);
    maxY = Math.max(maxY, 0);

    if (minY === maxY) {
        return 260;
    }

    return 470 - ((y - minY) / (maxY - minY)) * 380;
}

funcTypeInput.addEventListener("change", drawBaseGraph);
funcInput.addEventListener("input", drawBaseGraph);
leftInput.addEventListener("input", drawBaseGraph);
rightInput.addEventListener("input", drawBaseGraph);
epsInput.addEventListener("input", drawBaseGraph);

document.fonts.ready.then(() => {
    createUserFunction();
    drawBaseGraph();
});