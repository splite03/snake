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
`;

/**
 * Карта - двумерный массив [y][x]
 */
const map = [
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-2,-1,-1,-1,-3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [45,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,46],
    [41,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,43],
    [41,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,43],
    [48,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,44,47],
];

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
    fs: '#4c8a49',
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
    dir: null,
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
    speed: 1,
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

    map.forEach((yr, y) => {
        yr.forEach((xi, x) => {
            switch (xi) {
                case 0: // empty cell
                    ctx.fillStyle = emptyCellModel.fs;

                    ctx.fillRect(x * cellModel.w, y * cellModel.h, cellModel.w, cellModel.h);
                    ctx.strokeStyle = global.fc;
                    ctx.lineWidth = emptyCellModel.lw;
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
 *  Инициализация приложения
 */
function setup() {
    /**
     * Проставление времени в 0
     */
    timerModel.ct = 0;

    /**
     * Запуск рендера
     */
    render();
}

/**
 * Инициализация
 */
setup();
