/**
 * LegoTilt - Matter.js Physics Engine & Animation Logic
 */

// Matter.js alias
const { Engine, Render, Runner, Bodies, Composite, World, Events } = Matter;

let engine, render, runner;
let initialized = false;

// UI Elements
const uiOverlay = document.getElementById('ui-overlay');
const startBtn = document.getElementById('start-btn');

/**
 * Initialize Physics World
 */
function initPhysics() {
    // 1. Create Engine
    engine = Engine.create();
    engine.gravity.scale = 0.001; // Default gravity

    // 2. Create Renderer
    render = Render.create({
        element: document.getElementById('canvas-container'),
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#0d0f12',
            pixelRatio: window.devicePixelRatio
        }
    });

    // 3. Create Boundaries
    const thick = 100;
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + thick/2, window.innerWidth, thick, { isStatic: true });
    const leftWall = Bodies.rectangle(-thick/2, window.innerHeight / 2, thick, window.innerHeight, { isStatic: true });
    const rightWall = Bodies.rectangle(window.innerWidth + thick/2, window.innerHeight / 2, thick, window.innerHeight, { isStatic: true });
    const ceiling = Bodies.rectangle(window.innerWidth / 2, -thick/2, window.innerWidth, thick, { isStatic: true });

    Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // 4. Run the Engine
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    // Initial drop
    dropBricks(50);
    
    // Start orientation listener
    initTiltControls();
}

/**
 * Create and drop random LEGO bricks
 */
function dropBricks(count) {
    const legoColors = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#ffffff'];
    const bricks = [];

    for (let i = 0; i < count; i++) {
        const isLong = Math.random() > 0.6;
        const width = isLong ? 60 : 30;
        const height = 30;
        
        const brick = Bodies.rectangle(
            Math.random() * window.innerWidth,
            -100 - (Math.random() * 500),
            width,
            height,
            {
                render: {
                    fillStyle: legoColors[Math.floor(Math.random() * legoColors.length)],
                    strokeStyle: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                },
                friction: 0.8,
                restitution: 0.2,
                density: 0.01
            }
        );
        bricks.push(brick);
    }

    Composite.add(engine.world, bricks);
}

/**
 * Handle Device Tilt
 */
function initTiltControls() {
    window.addEventListener('deviceorientation', (event) => {
        if (!isPlaying) return;

        // Front-to-back tilt (range -180 to 180) -> Y gravity
        // Left-to-right tilt (range -90 to 90) -> X gravity
        const gravityX = event.gamma / 45; // Normalize to approx -2 to 2
        const gravityY = event.beta / 45;

        engine.gravity.x = gravityX;
        engine.gravity.y = gravityY;
    });
}

/**
 * UI & Start Logic
 */
let isPlaying = false;

startBtn.addEventListener('click', async () => {
    // iOS Permission Request
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') {
                alert('Permission to access sensors was denied.');
                return;
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Anime.js transition
    anime({
        targets: '#ui-overlay',
        opacity: 0,
        translateY: -50,
        duration: 800,
        easing: 'easeInOutQuint',
        complete: () => {
            uiOverlay.style.display = 'none';
            isPlaying = true;
            if (!initialized) {
                initPhysics();
                initialized = true;
            }
        }
    });
});

// Resize handler
window.addEventListener('resize', () => {
    if (render) {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
    }
});
