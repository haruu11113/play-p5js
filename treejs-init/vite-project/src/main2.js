import * as THREE from 'three';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const text = 'Hello, World!';
const fontSize = Math.min(canvas.width / text.length * 0.8, canvas.height * 0.3);

ctx.font = `bold ${fontSize}px Arial`;
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(text, canvas.width / 2, canvas.height / 2);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
ctx.clearRect(0, 0, canvas.width, canvas.height);

class Particle {
    constructor(x, y, targetX, targetY) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = Math.random() * 0.02 + 0.01;
        this.velocityX = 0;
        this.velocityY = 0;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`;
    }

    update() {
        this.velocityX = (this.targetX - this.x) * this.speed;
        this.velocityY = (this.targetY - this.y) * this.speed;
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    for (let y = 0; y < imageData.height; y += 5) {
        for (let x = 0; x < imageData.width; x += 5) {
            if (imageData.data[(y * imageData.width + x) * 4 + 3] > 128) {
                particles.push(new Particle(x, y, x, y));
            }
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    requestAnimationFrame(animate);
}

init();
animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
