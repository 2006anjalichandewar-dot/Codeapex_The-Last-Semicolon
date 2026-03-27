from collections import defaultdict
from typing import Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._rooms: Dict[int, Set[WebSocket]] = defaultdict(set)

    async def connect(self, document_id: int, websocket: WebSocket):
        await websocket.accept()
        self._rooms[document_id].add(websocket)

    def disconnect(self, document_id: int, websocket: WebSocket):
        room = self._rooms.get(document_id)
        if not room:
            return
        room.discard(websocket)
        if not room:
            self._rooms.pop(document_id, None)

    async def broadcast(self, document_id: int, message: dict, sender: WebSocket):
        room = self._rooms.get(document_id, set())
        for ws in list(room):
            if ws is sender:
                continue
            await ws.send_json(message)


manager = ConnectionManager()
