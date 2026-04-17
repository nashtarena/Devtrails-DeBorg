from fastapi import APIRouter, Depends, Body
from dependencies import get_current_partner
from services.telemetry_service import TelemetryService
from typing import Dict, Any

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.post("/collect")
async def collect_telemetry(
    data: Dict[str, Any] = Body(...),
    current: dict = Depends(get_current_partner)
):
    """
    Endpoint for mobile app to sync batched telemetry data.
    """
    partner_id = current["partner_id"]
    await TelemetryService.save_telemetry(partner_id, data)
    return {"status": "success", "received": len(data)}

@router.get("/latest")
async def get_latest_telemetry(current: dict = Depends(get_current_partner)):
    """
    Fetch the latest recorded telemetry for the partner.
    """
    return await TelemetryService.get_device_telemetry(current["partner_id"])
