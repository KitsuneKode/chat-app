import { WebSocket, WebSocketServer } from 'ws';
import { PORT } from './config';

const Rooms: Map<string, Set<WebSocket>> = new Map();
const Clients: Map<WebSocket, string> = new Map();

//setting 3 rooms as demo

Rooms.set('NSFW Room', new Set());
Rooms.set('Nerd Room', new Set());
Rooms.set('SFW Room', new Set());

const permanantRooms = ['NSFW Room', 'Nerd Room', 'SFW Room'];
let clientCounter = 0;

const wss = new WebSocketServer({ port: Number(PORT) });

wss.on('connection', (socket) => {
  const clientId = `client_${++clientCounter}`;
  Clients.set(socket, clientId);
  socket.send('Connection to server. Welcome ' + clientId);

  console.log('Client' + clientId + ' connected');
  socket.on('message', (message) => {
    console.log(message.toString());
    const messageFromClient = JSON.parse(message.toString());

    if (messageFromClient?.type === 'join_room') {
      if (
        messageFromClient.payload?.room &&
        Rooms.has(messageFromClient.payload.room)
      ) {
        if (!Rooms.get(messageFromClient.payload.room)?.has(socket)) {
          Rooms.get(messageFromClient.payload.room)?.add(socket);
          Rooms.get(messageFromClient.payload.room)?.forEach((soc) =>
            soc.send(`${clientId} has joined the room`)
          );
          socket.send(
            JSON.stringify({
              status: 'true',
              message: `Connected to room ${messageFromClient.payload.room}`,
            })
          );
        } else {
          console.log('Already connected');
          // socket.send(clientId + ' is already connected to the group');     //Not necessary
        }
      } else {
        socket.send(
          JSON.stringify({
            status: false,
            message: `Room with the name ${messageFromClient.payload.room} does not exists. Create a new Room`,
          })
        );
      }
    }

    if (messageFromClient?.type === 'create_room') {
      if (
        messageFromClient.payload?.room &&
        Rooms.has(messageFromClient.payload.room)
      ) {
        Rooms.get(messageFromClient.payload.room)?.add(socket);
        socket.send(
          JSON.stringify({
            status: 'false',
            message: `Room with name ${messageFromClient.payload.room} already exists`,
          })
        );
      } else {
        Rooms.set(messageFromClient.payload.room, new Set());
        socket.send(
          JSON.stringify({
            status: true,
            message: `Successfully created Room ${messageFromClient.payload.room}`,
          })
        );
      }
    }

    if (messageFromClient?.type === 'chat') {
      const socketsToBroadcast = Rooms.get(messageFromClient.payload.room);

      if (socketsToBroadcast?.has(socket)) {
        const client = Clients.get(socket);
        socketsToBroadcast?.forEach((socket) => {
          socket.send(
            'Sent by ' + client + ' : ' + messageFromClient?.payload?.message
          );
        });
      }
    }
  });

  socket.on('close', () => {
    console.log('Client ' + clientId + ' has disconnected');

    Clients.delete(socket);

    Rooms.forEach((clients, room) => {
      clients?.delete(socket);
      clients.forEach((soc) => soc.send(clientId + ' has left the room'));
      if (clients.size == 0 && !permanantRooms.includes(room))
        Rooms.delete(room);
    });
  });
});
