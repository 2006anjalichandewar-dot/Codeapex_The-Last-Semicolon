from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.auth_service import get_user_from_token
from app.services.connection_manager import manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: int, token: str | None = None):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    try:
        user = get_user_from_token(db, token)
    except Exception:
        db.close()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(document_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            payload = {
                "document_id": document_id,
                "user_id": user.id,
                "content": data.get("content", ""),
            }
            await manager.broadcast(document_id, payload, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(document_id, websocket)
    finally:
        db.close()
