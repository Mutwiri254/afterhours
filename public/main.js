console.log("Attempting socket connection...");

console.log("AfterHours is open.");

const ambience = new Audio("/assets/ambience.mp3");
ambience.loop = true;
ambience.volume = 0.3;

const socket = io();
const presenceContainer = document.getElementById("presence");

let dots = [];
socket.on("presence", (count) => {
  // Clear old dots
  dots.forEach(dot => dot.remove());
  dots = [];

  // Create new dots (excluding yourself)
  for (let i = 0; i < count - 1; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";

    // Random calm placement
    dot.style.left = `${20 + Math.random() * 60}%`;
    dot.style.top = `${20 + Math.random() * 60}%`;

    presenceContainer.appendChild(dot);
    dots.push(dot);

    // Fade in gently
    requestAnimationFrame(() => {
      dot.classList.add("visible");
    });
  }
});

window.addEventListener("load", () => {
  document.body.classList.add("visible");
});

document.addEventListener("click", () => {
  if (ambience.paused) {
    ambience.play();
  }
});
