console.log("AfterHours is open.");

const ambience = new Audio("../assets/ambience.mp3");
ambience.loop = true;
ambience.volume = 0.3;

window.addEventListener("load", () => {
  document.body.classList.add("visible");
});

// Browsers require user interaction before playing audio
document.addEventListener("click", () => {
  if (ambience.paused) {
    ambience.play();
    console.log("Ambience started.");
  }
});
