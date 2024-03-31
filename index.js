import {levels} from "./maps.js";

/**
 * HTML Elements
 */
const canvas = document.getElementById('canvas');
const restartButton = document.querySelector('.restart');
const pauseButton = document.querySelector('.pause');

/**
 * Canvas Context
 */
const ctx = canvas.getContext('2d');

/**
 *  Виды рендеримых ячеек на карта
 */
const mapCells = `
    0 - empty cell
    1 - wall
    
   -1 - non-reachable space
   -2 - timer
   -3 - points
   
   41 - left stroke wall
   42 - top stroke wall
   43 - right stroke wall
   44 - bottom stroke wall
   45 - top-left stroke wall
   46 - top-right stroke wall
   47 - bottom-right stroke wall
   48 - bottom-left stroke wall
   
   71 - snake head looking top
   
   81 - snake body moving top
   82 - snake body moving right
   83 - snake body moving bottom
   84 - snake body moving left
   
   91 - snake tail moving top
   92 - snake tail moving right
   93 - snake tail moving bottom
   94 - snake tail moving left
`;

/**
 * Текущий уровень
 */
let currentLevel = 1
;
/**
 * Карта - двумерный массив [y][x]
 */
let map = getMap(currentLevel);


/**
 * Общие параметры
 */
const global = {
    fc: '#212121'
}

/**
 * Параметры моделей
 */
const cellModel = {
    w: 35,
    h: 35,
    t: 4,
}
const emptyCellModel = {
    w: cellModel.w,
    h: cellModel.h,
    fs: '#96be02',
    ss: 'rgb(99,99,99)',
    lw: 4,
};
const strokeWallModel = {
    w: cellModel.w,
    h: cellModel.h,
    t: cellModel.t,
    g: (cellModel.w / 2) - (cellModel.t / 2),
    fs: global.fc,
    ss: global.fc,
}
const wallModel = {
    w: cellModel.w,
    h: cellModel.h,
    fs: global.fc,
    ss: global.fc,
    lw: 4,
}
const movementModel = {
    dir: 'top', // top | left | right | bottom
}
const timerModel = {
    ct: 0,
    fz: 32,
    fc: global.fc,
    sc: global.fc,
}
const pointsModel = {
    p: 0,
    fz: 32,
    fc: global.fc,
    sc: global.fc,
}
const snakeModel = {
    speed: 10,
}

/**
 * Выставляем размеры канваса в зависимости от размера карты и ячейки
 */
canvas.height = map.length * cellModel.h;
canvas.width = map[0].length * cellModel.w;

/**
 * Параметры рендера
 */
let renderInterval = 1000 / snakeModel.speed;

/**
 * Рендер фрейма
 */
function renderFrame() {

    /**
     * Рендер ректов карты
      */

    /**
     * Очистка предыдущего кадра
     */
    ctx.fillStyle = emptyCellModel.fs;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let count = 0;
    map.forEach((yr, y) => {
        yr.forEach((xi, x) => {
            switch (xi) {
                case 0: // empty cell
                    /**
                     * Fill cell main color
                     * @type {string}
                     */
                    ctx.fillStyle = emptyCellModel.fs;
                    ctx.fillRect(x * cellModel.w, y * cellModel.h, cellModel.w, cellModel.h);

                    /**
                     * Stroke (for dev)
                     */
                    ctx.strokeStyle = global.fc;
                    ctx.lineWidth = 2 ?? emptyCellModel.lw;
                    ctx.strokeRect(x * cellModel.w, y * cellModel.h, cellModel.w, cellModel.h);
                    break;
                case 1: // wall
                    ctx.fillStyle = wallModel.fs;
                    ctx.fillRect(x * wallModel.w, y * wallModel.h, wallModel.w, wallModel.h);
                    break;
                case -1: // non-reachable space
                    break;
                case -2: // timer
                    const minutes = new Date(timerModel.ct).getMinutes();
                    const seconds = new Date(timerModel.ct).getSeconds();
                    const time = `${getTimeDouble(minutes)}:${getTimeDouble(seconds)}`;

                    /**
                     * Рисуем время
                     */
                    ctx.font = `${timerModel.fz ?? 24}px Pixelify Sans`;
                    ctx.fillStyle = timerModel.fc;
                    ctx.fillText(time, x*cellModel.w, y*cellModel.h);

                    /**
                     * Добавление прошедшего времени
                     */
                    timerModel.ct += renderInterval;
                    break;
                case -3:
                    /**
                     * Рисуем очки
                     */
                    ctx.font = `${pointsModel.fz ?? 24}px Pixelify Sans`;
                    ctx.fillStyle = pointsModel.fc;
                    ctx.fillText(`Points: ${pointsModel.p}`, x*cellModel.w, y*cellModel.h);
                    break;
                case 41: // left stroke wall
                case 43: // right stroke wall
                    const l = {
                        x: x * strokeWallModel.w + strokeWallModel.g,
                        y: y * strokeWallModel.h,
                        w: strokeWallModel.t,
                        h: strokeWallModel.h
                    }
                    ctx.fillStyle = strokeWallModel.fs;
                    ctx.fillRect(l.x, l.y, l.w, l.h);
                    break;
                case 42: // top stroke wall
                case 44: // bottom stroke wall
                    const t = {
                        x: x * strokeWallModel.w,
                        y: y * strokeWallModel.h + strokeWallModel.g,
                        w: strokeWallModel.w,
                        h: strokeWallModel.t
                    }
                    ctx.fillStyle = strokeWallModel.fs;
                    ctx.fillRect(t.x, t.y, t.w, t.h);
                    break;
                case 45: // top-left stroke wall
                case 46: // top-right stroke wall
                case 47: // bottom-right stroke wall
                case 48: // bottom-left stroke wall
                    const config = {
                        45: ['b', 'r'],
                        46: ['l', 'b'],
                        47: ['t', 'l'],
                        48: ['t', 'r'],
                    }[xi];
                    const halfs = getHalfs(x, y);

                    config.forEach((e) => {
                        ctx.fillStyle = strokeWallModel.fs;
                        ctx.fillRect(halfs[e].x, halfs[e].y, halfs[e].w, halfs[e].h);
                    })
                    break;
                case 71: // snake head in 4 dir

                    /* Костыль на пропуск фрейма, чтобы не ловило больше одной головы за рендер в кейса */
                    count++;
                    if (count > 1)  return;

                    moveSnake(x, y);
                    drawHead(x, y);
                    break;
                default: // unexpected thing
                    break;
            }
        });
    });
    console.log('render');
}

/**
 * Начать редерить фреймы
 */
let intervalRenderer;
function render(rerender = false) {
    if (rerender) clearInterval(intervalRenderer);

    /**
     * Первый фрейм
     */
    renderFrame();

    /**
     * Цикл в 1 сек для переотрисовки
     */
    intervalRenderer = setInterval(() => {
        renderFrame();
    }, renderInterval);

}

/**
 * Утилиты
 */
function getMap(level) {
    return JSON.parse(JSON.stringify(levels[level]));
}
function getTimeDouble(num) {
    return num > 9 ? num : `0${num}`;
}
function getHalfs(x, y) {
    return {
        b: {
            x: x * strokeWallModel.w + strokeWallModel.g,
            y: y * strokeWallModel.h + strokeWallModel.g,
            w: strokeWallModel.t,
            h: strokeWallModel.h / 2 + strokeWallModel.t / 2
        },
        r: {
            x: x * strokeWallModel.w + strokeWallModel.g,
            y: y * strokeWallModel.h + strokeWallModel.g,
            w: strokeWallModel.w / 2 + strokeWallModel.t / 2,
            h: strokeWallModel.t
        },
        t: {
            x: x * strokeWallModel.w + strokeWallModel.g,
            y: y * strokeWallModel.h,
            w: strokeWallModel.t,
            h: strokeWallModel.h / 2 + strokeWallModel.t / 2
        },
        l: {
            x: x * strokeWallModel.w,
            y: y * strokeWallModel.h + strokeWallModel.g,
            w: strokeWallModel.w / 2 + strokeWallModel.t / 2,
            h: strokeWallModel.t
        }
    };
}

/**
 * Snake
 */
function drawHead(x, y) {
    switch (movementModel.dir) {
        case 'top':
            ctx.beginPath();
            ctx.moveTo(x * wallModel.w, y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w, y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.15), y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.15), y * wallModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.85), y * wallModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.85), y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + cellModel.h);
            ctx.fillStyle = wallModel.fs;
            ctx.fill();
            break;
        case 'bottom':
            ctx.beginPath();
            ctx.moveTo(x * wallModel.w, y * wallModel.h);
            ctx.lineTo(x * wallModel.w, y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.15), y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.15), y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.85), y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.85), y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + (cellModel.h * 0.5));
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h);
            ctx.fillStyle = wallModel.fs;
            ctx.fill();
            break;
        case 'left':
            ctx.beginPath();
            ctx.moveTo(x * wallModel.w + cellModel.w, y * wallModel.h);
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h + cellModel.h * 0.85);
            ctx.lineTo(x * wallModel.w, y * wallModel.h + cellModel.h * 0.85);
            ctx.lineTo(x * wallModel.w, y * wallModel.h + cellModel.h * 0.15);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h + cellModel.h * 0.15);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h);
            ctx.fillStyle = wallModel.fs;
            ctx.fill();
            break;
        case 'right':
            ctx.beginPath();
            ctx.moveTo(x * wallModel.w, y * wallModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.5), y * wallModel.h);
            ctx.lineTo(x * wallModel.w + (cellModel.w * 0.5), y * wallModel.h + cellModel.h * 0.15);
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + cellModel.h * 0.15);
            ctx.lineTo(x * wallModel.w + cellModel.w, y * wallModel.h + cellModel.h * 0.85);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h + cellModel.h * 0.85);
            ctx.lineTo(x * wallModel.w + cellModel.w * 0.5, y * wallModel.h + cellModel.h);
            ctx.lineTo(x * wallModel.w, y * wallModel.h + cellModel.h);
            ctx.fillStyle = wallModel.fs;
            ctx.fill();
            break;
    }
}
function moveSnake(x, y) {
    switch (movementModel.dir) {
        case 'bottom':
            const isPossibleBottom = map[y + 1] ? map[y + 1][x] !== 1 : false;

            if (isPossibleBottom) {
                map[y][x] = 0;
                map[y+1][x] = 71;
            } else {
                map[y][x] = 0;
                map[4][x] = 71;
            }
            break;
        case 'right':
            const isPossibleRight = map[y][x + 1] !== 1;

            if (isPossibleRight) {
                map[y][x] = 0;
                map[y][x + 1] = 71;
            } else {
                map[y][x] = 0;
                map[y][2] = 71;
            }
            break;
        case 'left':
            const isPossibleLeft = map[y][x - 1] !== 1;

            if (isPossibleLeft) {
                map[y][x] = 0;
                map[y][x - 1] = 71;
            } else {
                map[y][x] = 0;
                map[y][map[0].length - 3] = 71;
            }
            break;
        case 'top':
            const isPossibleTop = map[y - 1][x] !== 1;

            if (isPossibleTop) {
                map[y][x] = 0;
                map[y-1][x] = 71;
            } else {
                map[y][x] = 0;
                map[map.length - 3][x] = 71;
            }
            break;
    }
}

/**
 * Колбеки для кнопок
 */
function restart () {
    if (intervalRenderer) {
        clearInterval(intervalRenderer);
        intervalRenderer = null;
    }
    setup();
}
function pause () {
    console.log(map)
    if (intervalRenderer) { // не на паузе
        clearInterval(intervalRenderer);
        intervalRenderer = null;
        pauseButton.innerText = 'Unpause';
        pauseButton.classList.toggle('paused');
    } else {
        render();
        pauseButton.innerText = 'Pause';
        pauseButton.classList.toggle('paused');
    }
}

/**
 * Слушатели кнопок
 */
restartButton.addEventListener('click', restart);
pauseButton.addEventListener('click', pause);

/**
 * Управление
 */
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            movementModel.dir = 'top';
            break;
        case 'ArrowDown':
            movementModel.dir = 'bottom';
            break;
        case 'ArrowLeft':
            movementModel.dir = 'left';
            break;
        case 'ArrowRight':
            movementModel.dir = 'right';
            break;
    }
})

/**
 *  Инициализация приложения
 */
function setup() {
    /**
     * Проставление времени в 0
     */
    timerModel.ct = 0;

    /**
     * Reset Current Level
     */
    map = getMap(currentLevel);

    /**
     * Запуск рендера
     */
    render();
}

/**
 * Инициализация
 */
setup();
