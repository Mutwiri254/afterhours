console.log("Attempting socket connection...");

console.log("AfterHours is open.");

// --- Web Audio Setup ---
let audioContext;
let ambienceBuffer;
let ambienceSource;
let gainNode;
let panNode;

const baseVolume = 0.3;

async function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const response = await fetch("/assets/ambience.mp3");
  const arrayBuffer = await response.arrayBuffer();
  ambienceBuffer = await audioContext.decodeAudioData(arrayBuffer);

  ambienceSource = audioContext.createBufferSource();
  ambienceSource.buffer = ambienceBuffer;
  ambienceSource.loop = true;

  gainNode = audioContext.createGain();
  gainNode.gain.value = baseVolume;

  panNode = audioContext.createStereoPanner();

  ambienceSource.connect(panNode);
  panNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  ambienceSource.start();
}


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

document.addEventListener("click", async () => {
  if (!audioContext) {
    await setupAudio();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
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

  // --- Spatial Panning Based on Position ---
if (panNode) {
  const normalizedX = (myPosition.x - 50) / 50; 
  // Converts 0–100 into -1 to +1

  const smoothedPan =
    panNode.pan.value + (normalizedX - panNode.pan.value) * 0.05;

  panNode.pan.value = smoothedPan;
}

  // Emit your smoothed position
  socket.emit("move", myPosition);

  // --- Smooth peer movement ---
  Object.values(peers).forEach(peer => {

    
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

  // --- Calculate overall proximity intensity ---
let overallProximity = 0;

Object.values(peers).forEach(peer => {
  const dx = peer.x - myPosition.x;
  const dy = peer.y - myPosition.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const p = Math.max(0, 1 - dist / 40);

  if (p > overallProximity) {
    overallProximity = p;
  }
});

// --- Adjust ambient volume gently ---
const intimacyReduction = overallProximity * 0.15;
const targetVolume = Math.max(0.05, baseVolume - intimacyReduction);

// Smooth volume change
if (gainNode) {
  gainNode.gain.value += (targetVolume - gainNode.gain.value) * 0.05;
}



  requestAnimationFrame(animate);
}

animate();



