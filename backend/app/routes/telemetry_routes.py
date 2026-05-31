from fastapi import APIRouter, Query
from app.services.telemetry_service import TelemetryService
from app.utils.parser import build_status

router = APIRouter(prefix="/api", tags=["telemetry"])


def get_service() -> TelemetryService:
    from app.main import telemetry_service
    return telemetry_service


@router.get("/telemetry/latest")
async def get_latest():
    service = get_service()
    latest = service.get_latest()
    if latest is None:
        return {"status": "no_data", "data": None}
    return {"status": "ok", "data": latest.model_dump()}


@router.get("/telemetry/history")
async def get_history(limit: int = Query(default=100, le=1000)):
    service = get_service()
    records = service.get_history(limit)
    return {
        "status": "ok",
        "data": [r.model_dump() for r in records],
        "total": len(records),
    }


@router.get("/status")
async def get_status():
    service = get_service()
    state = service.get_system_state()
    return build_status(state).model_dump()
