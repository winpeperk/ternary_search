const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const funcTypeInput = document.getElementById("funcType");
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

function f(x) {
    if (funcTypeInput.value === "max") {
        return -0.1 * (x - 3) ** 2 + 20;
    }
    return 0.15 * (x + 3) ** 2 + 2;
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
    leftInput.disabled = disabled;
    rightInput.disabled = disabled;
    epsInput.disabled = disabled;
}

function startSearch() {
    clearInterval(timer);

    let l = Number(leftInput.value);
    let r = Number(rightInput.value);
    const eps = Number(epsInput.value);
    const type = funcTypeInput.value;

    if (!Number.isFinite(l) || !Number.isFinite(r) || !Number.isFinite(eps) || l >= r || eps <= 0) {
        stepInfo.textContent = "Проверьте границы интервала и точность.";
        result.textContent = "";
        drawBaseGraph();
        return;
    }

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
        `Результат: x ≈ ${step.x.toFixed(4)}, f(x) ≈ ${step.y.toFixed(4)}`;

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
    drawAxes();
    drawFunction();
}

function drawAxes() {
    ctx.beginPath();

    ctx.moveTo(60, 420);
    ctx.lineTo(950, 420);

    ctx.moveTo(500, 40);
    ctx.lineTo(500, 450);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "20px Cascadia Mono";
    ctx.fillText("x", 960, 425);
    ctx.fillText("y", 508, 45);
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
    const y = f(x);
    const py = mathToScreenY(y);

    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(px, 420);
    ctx.lineTo(px, py);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.font = "20px Cascadia Mono";
    ctx.fillText(label, px - 10, 445);
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
    const type = funcTypeInput.value;

    if (type === "max") {
        return 420 - y * 12;
    }

    return 420 - y * 6;
}

funcTypeInput.addEventListener("change", drawBaseGraph);
leftInput.addEventListener("input", drawBaseGraph);
rightInput.addEventListener("input", drawBaseGraph);
epsInput.addEventListener("input", drawBaseGraph);

drawBaseGraph();