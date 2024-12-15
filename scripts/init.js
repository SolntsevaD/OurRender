let cvs;
let gfx;
let frameCounterElement;
let player;
let view;
let started = false;
let pause = false;
let time = 0;
let previousTime;
let mouse = { down: false, lastX: 0, lastY: 0, currX: 0, currY: 0, dx: 0, dy: 0 };
let keys = {};

const times = [];
let fps;

// Глобальные переменные
let WIDTH = 800;
let HEIGHT = 600;
let SCALE = 4;
let FOV = HEIGHT / SCALE;
let zClipNear = 0.2;
let renderFlag = 0;
let globalAlpha = 255;

// Флаги рендеринга
const RENDER_CW = 0;
const RENDER_CCW = 1;
const SET_Z_9999 = 2;
const RENDER_FACE_NORMAL = 4;
const EFFECT_NO_LIGHT = 8;

function init() {
    cvs = document.getElementById("canvas");
    gfx = cvs.getContext("2d");

    loadTextures();
    loadModels();

    window.addEventListener("mousedown", (e) => {
        if (e.button != 0) return;
        mouse.down = true;
    }, false);
    window.addEventListener("mouseup", (e) => {
        if (e.button != 0) return;
        mouse.down = false;
    }, false);

    window.addEventListener("keydown", (e) => {
        if (e.key == "Escape") pause = !pause;
        if (e.key == "w" || e.key == "ArrowUp") keys.up = true;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = true;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = true;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = true;
        if (e.key == " ") keys.space = true;
        if (e.key == "c") keys.c = true;
        if (e.key == "q") keys.q = true;
        if (e.key == "e") keys.e = true;
        if (e.key == "Shift") keys.shift = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key == "w" || e.key == "ArrowUp") keys.up = false;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = false;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = false;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = false;
        if (e.key == " ") keys.space = false;
        if (e.key == "c") keys.c = false;
        if (e.key == "q") keys.q = false;
        if (e.key == "e") keys.e = false;
        if (e.key == "Shift") keys.shift = false;
    });

    window.addEventListener("mousemove", (e) => {
        mouse.currX = e.screenX;
        mouse.currY = e.screenY;
    });

    frameCounterElement = document.getElementById("frame_counter");

    WIDTH = WIDTH / SCALE;
    HEIGHT = HEIGHT / SCALE;

    previousTime = new Date().getTime();

    view = new View(WIDTH, HEIGHT);

    for (let i = 0; i < WIDTH * HEIGHT; i++)
        view.pixels[i] = Math.random() * 0xffffff;

    let sample = new Bitmap(64, 64);
    for (let i = 0; i < 64 * 64; i++) {
        const x = i % 64;
        const y = int(i / 64);
        sample.pixels[i] = (((x << 6) % 0xff) << 8) | (y << 6) % 0xff;
    }

    textures["sample0"] = sample;

    sample = new Bitmap(64, 64);
    sample.clear(0xff00ff);

    textures["sample1"] = sample;

    player = new Player();
}

function run() {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) times.shift();

    const delta = (now - times[times.length - 1]) / 1000.0;

    times.push(now);
    fps = times.length;
    frameCounterElement.innerHTML = fps + "fps";

    if (!started && loadedResources == resourceReady) {
        started = true;
        cvs.setAttribute("width", WIDTH * SCALE + "px");
        cvs.setAttribute("height", HEIGHT * SCALE + "px");
        gfx.font = "48px verdana";
    }

    if (started && !pause) {
        update(delta);
        render();
        time += delta;
    } else if (pause) {
        gfx.fillText("PAUSE", 4, 40);
    }

    requestAnimationFrame(run);
}

function update(delta) {
    mouse.dx = mouse.currX - mouse.lastX;
    mouse.dy = mouse.currY - mouse.lastY;
    mouse.lastX = mouse.currX;
    mouse.lastY = mouse.currY;

    player.update(delta);
    view.update(delta);
}

function render() {
    view.clear(0x808080);
    view.renderView();
    gfx.putImageData(convertBitmapToImageData(view, SCALE), 0, 0);
}
