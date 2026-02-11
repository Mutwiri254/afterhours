const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let peers = {};

io.on("connection", (socket) => {
  peers[socket.id] = { x: 50, y: 50 };

  io.emit("peers", peers);

  socket.on("move", (position) => {
    peers[socket.id] = position;
    io.emit("peers", peers);
  });

  socket.on("disconnect", () => {
    delete peers[socket.id];
    io.emit("peers", peers);
  });
});

server.listen(3000, () => {
  console.log("AfterHours server running on http://localhost:3000");
});
