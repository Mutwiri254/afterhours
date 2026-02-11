console.log("Attempting socket connection...");

console.log("AfterHours is open.");

const ambience = new Audio("/assets/ambience.mp3");
ambience.loop = true;
ambience.volume = 0.3;

const socket = io();
const presenceContainer = document.getElementById("presence");

let myPosition = { x: 50, y: 50 };
let myTarget = { x: 50, y: 50 };


let peers = {};
let myId = null;

// When connected
socket.on("connect", () => {
  myId = socket.id;
});

// Receive all peer positions
socket.on("peers", (allPeers) => {
  updatePeers(allPeers);

const message = document.querySelector("#bar p");

if (Object.keys(allPeers).length > 1) {
  message.style.opacity = "0";
} else {
  message.style.opacity = "0.7";
}

});

function updatePeers(allPeers) {
  Object.keys(peers).forEach(id => {
    if (!allPeers[id]) {
      peers[id].element.remove();
      delete peers[id];
    }
  });

  Object.keys(allPeers).forEach(id => {
    if (id === myId) return;

    if (!peers[id]) {
      const dot = document.createElement("div");
      dot.className = "dot visible";
      presenceContainer.appendChild(dot);

      peers[id] = {
  element: dot,
  x: 50,
  y: 50,
  targetX: allPeers[id].x,
  targetY: allPeers[id].y,
  idleOffset: Math.random() * 1000
};

    }

    peers[id].targetX = allPeers[id].x;
    peers[id].targetY = allPeers[id].y;
  });
}

window.addEventListener("load", () => {
  document.body.classList.add("visible");
});

document.addEventListener("click", () => {
  if (ambience.paused) {
    ambience.play();
  }
});

document.addEventListener("mousemove", (event) => {
  const rect = document.body.getBoundingClientRect();
  myTarget.x = (event.clientX / rect.width) * 100;
  myTarget.y = (event.clientY / rect.height) * 100;
});

function animate() {

  // --- Calculate gravity FIRST ---
  let nearestDistance = Infinity;

  Object.values(peers).forEach(peer => {
    const dx = peer.x - myPosition.x;
    const dy = peer.y - myPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < nearestDistance) {
      nearestDistance = dist;
    }
  });

  let gravityFactor = 0;

  if (nearestDistance < 50) {
    gravityFactor = 1 - nearestDistance / 50;
  }

  // --- Now apply smoothed movement ---
  const baseSpeed = 0.06;
  const slowedSpeed = baseSpeed * (1 - gravityFactor * 0.5);

  myPosition.x += (myTarget.x - myPosition.x) * slowedSpeed;
  myPosition.y += (myTarget.y - myPosition.y) * slowedSpeed;

  // Emit your smoothed position
  socket.emit("move", myPosition);

  // --- Smooth peer movement ---
  Object.values(peers).forEach(peer => {

    // IMPORTANT: You forgot to update peer.x and peer.y interpolation
    peer.x += (peer.targetX - peer.x) * 0.08;
    peer.y += (peer.targetY - peer.y) * 0.08;

    const dx = peer.x - myPosition.x;
    const dy = peer.y - myPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const proximity = Math.max(0, 1 - distance / 40);
    const scale = 1 + proximity * 0.6;

    peer.element.style.boxShadow =
      `0 0 ${8 + proximity * 20}px rgba(255, 180, 120, ${proximity * 0.4})`;

    const time = Date.now() * 0.0005;
    const idleX = Math.sin(time + peer.idleOffset) * 0.3;
    const idleY = Math.cos(time + peer.idleOffset) * 0.3;

    peer.element.style.left = `${peer.x + idleX}%`;
    peer.element.style.top = `${peer.y + idleY}%`;
    peer.element.style.transform = `scale(${scale})`;
  });

  requestAnimationFrame(animate);
}

animate();



