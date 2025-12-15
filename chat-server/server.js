const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check route - ADD THIS LINE
app.get('/', (req, res) => res.send('Backend is alive!'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track how many sockets each user has open
const userConnections = new Map(); // senderId -> count

function generateGuestId() {
  return 'guest-' + Math.floor(Math.random() * 10000);
}

// Broadcast helper
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Send a full snapshot of currently online users
function broadcastPresenceSnapshot() {
  const onlineUsers = Array.from(userConnections.keys());
  broadcast({ type: 'presenceSnapshot', users: onlineUsers });
}

// Heartbeat to clean up dead sockets
function heartbeat() {
  this.isAlive = true;
}

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  ws.id = generateGuestId();
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  console.log(`Client connected: ${ws.id}`);

  ws.on('message', (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message.toString());
    } catch {
      parsed = { text: message.toString(), sender: ws.id };
    }

    let data;

    if (parsed.type === 'typing' || parsed.type === 'presence') {
      data = parsed;
      if (!data.senderId) data.senderId = ws.id;

      if (data.type === 'presence') {
        const count = userConnections.get(data.senderId) || 0;
        if (data.status === 'online') {
          userConnections.set(data.senderId, count + 1);
          if (count === 0) {
            broadcast({ type: 'presence', senderId: data.senderId, status: 'online' });
          }
          broadcastPresenceSnapshot();
        } else if (data.status === 'offline') {
          if (count > 1) {
            userConnections.set(data.senderId, count - 1);
          } else {
            userConnections.delete(data.senderId);
            broadcast({ type: 'presence', senderId: data.senderId, status: 'offline' });
          }
          broadcastPresenceSnapshot();
        }
      } else {
        // typing event, just rebroadcast
        broadcast(data);
      }
    } else {
      // Treat as a chat message
      data = {
        text: parsed.text,
        sender: parsed.sender || ws.id,
        senderId: parsed.senderId || ws.id,
        avatar: parsed.avatar || null,
        timestamp: parsed.timestamp || Date.now(),
      };
      broadcast(data);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.id}`);
    const senderId = ws.id;
    const count = userConnections.get(senderId) || 0;
    if (count > 1) {
      userConnections.set(senderId, count - 1);
    } else if (count === 1) {
      userConnections.delete(senderId);
      broadcast({ type: 'presence', senderId, status: 'offline' });
    }
    broadcastPresenceSnapshot();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});