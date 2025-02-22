import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<string[]>([
    'my message',
    'message 1',
  ]);

  const wsRef = useRef<WebSocket | null>(null);

  const [wsStatus, setWsStatus] = useState<boolean>(false);

  useEffect(() => {
    const ws: WebSocket = new WebSocket('http://localhost:8080');
    console.log(ws);
    wsRef.current = ws;
    ws.onopen = () => {
      setWsStatus(true);
      console.log('Connected to websocket');
      ws.send(
        JSON.stringify({
          type: 'join_room',
          payload: {
            room: 'Nerd Room',
          },
        })
      );
      setMessages((mes) => [...mes, 'Connected to websocket Server']);
    };

    ws.onmessage = (event) => {
      console.log(event.data);

      setMessages((msg) => [...msg, event.data]);
    };

    ws.onclose = () => {
      console.log('closed connection');
      setWsStatus(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsStatus(false);
    };
  }, []);

  if (!wsStatus)
    return (
      <div className="bg-gray-700 flex flex-col justify-center h-screen">
        <span className="text-center text-4xl text-white">
          No Websocket Connection
        </span>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-700 justify-between">
      <div className="bg-brown- flex flex-col py-2 ">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-pink-300 m-3 px-4 py-2 rounded-2xl w-fit"
          >
            {msg}
          </div>
        ))}
      </div>

      <div className="bg-red-500 w-full flex">
        <input
          type="text"
          ref={inputRef}
          className="flex-1 bg-white p-4 rounded-2xl"
          placeholder="Your messages"
        />
        <button
          className="p-4 bg-blue-400 text-white rounded-2xl"
          onClick={() => {
            wsRef.current?.send(
              JSON.stringify({
                type: 'chat',
                payload: {
                  room: 'Nerd Room',
                  message: inputRef?.current?.value,
                },
              })
            );

            console.log(inputRef.current?.value);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
