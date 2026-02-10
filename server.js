const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let peopleInBar = 0;

io.on("connection", (socket) => {
  peopleInBar++;
  io.emit("presence", peopleInBar);

  socket.on("disconnect", () => {
    peopleInBar--;
    io.emit("presence", peopleInBar);
  });
});

server.listen(3000, () => {
  console.log("AfterHours server running on http://localhost:3000");
});
