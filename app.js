/**
 * LegoTilt - Matter.js Physics Engine & Interaction Logic
 */

const { Engine, Render, Runner, Bodies, Composite, World } = Matter;

let engine, render, runner;
let initialized = false;
let isPlaying = false;

const instructionOverlay = document.getElementById('instruction-overlay');

/**
 * Initialize Physics World
 */
function initPhysics() {
    engine = Engine.create();
    // Increase gravity scale for more "weight"
    engine.gravity.scale = 0.0015;

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

    // Boundaries (Fixed for window size)
    const thick = 100;
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + thick/2, window.innerWidth, thick, { isStatic: true });
    const leftWall = Bodies.rectangle(-thick/2, window.innerHeight / 2, thick, window.innerHeight, { isStatic: true });
    const rightWall = Bodies.rectangle(window.innerWidth + thick/2, window.innerHeight / 2, thick, window.innerHeight, { isStatic: true });
    const ceiling = Bodies.rectangle(window.innerWidth / 2, -thick/2, window.innerWidth, thick, { isStatic: true });

    Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
}

/**
 * Create and drop random LEGO bricks
 */
function dropBricks(count) {
    const legoColors = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#ffffff', '#ff00ff', '#00ffff'];
    const bricks = [];

    for (let i = 0; i < count; i++) {
        const isLong = Math.random() > 0.6;
        const width = isLong ? 60 : 30;
        const height = 30;
        
        const brick = Bodies.rectangle(
            Math.random() * window.innerWidth,
            -50 - (Math.random() * 400),
            width,
            height,
            {
                render: {
                    fillStyle: legoColors[Math.floor(Math.random() * legoColors.length)],
                    strokeStyle: 'rgba(255,255,255,0.1)',
                    lineWidth: 1
                },
                friction: 0.1, // Lower friction for better sliding on tilt
                restitution: 0.3, // Slight bounce
                density: 0.001
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
        const gravityX = (event.gamma || 0) / 30; 
        const gravityY = (event.beta || 0) / 30;

        engine.gravity.x = gravityX;
        engine.gravity.y = gravityY;
    });
}

/**
 * Handle First Tap / Interaction (Strict Click for iOS)
 */
let permissionRequested = false;

window.addEventListener('click', async () => {
    // 1. Request Sensor Access (MUST BE FIRST and ON CLICK for iOS)
    if (!permissionRequested && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                permissionRequested = true;
                initTiltControls();
            }
        } catch (error) {
            console.error("Sensor request failed:", error);
        }
    } else if (!permissionRequested) {
        // For non-iOS or browsers that don't need explicit requestPermission
        initTiltControls();
        permissionRequested = true;
    }

    // 2. Initial Setup
    if (!initialized) {
        initPhysics();
        initialized = true;
    }

    // 3. Drop Bricks & Hide Instructions
    isPlaying = true;
    dropBricks(20); 
    
    if (instructionOverlay.style.display !== 'none') {
        anime({
            targets: '#instruction-overlay',
            opacity: 0,
            duration: 1000,
            easing: 'easeOutQuad',
            complete: () => {
                instructionOverlay.style.display = 'none';
            }
        });
    }
});

// Remove the old pointerdown listener
// (The replacement above replaces the logic)


// Resize handler
window.addEventListener('resize', () => {
    if (render) {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        // In a real app, you'd update wall positions here too
    }
});
