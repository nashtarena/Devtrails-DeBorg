from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_partner
from app.database import get_supabase
from app.schemas.partner import AlertOut

router = APIRouter(prefix="/partner", tags=["alerts"])


@router.get("/alerts", response_model=list[AlertOut])
async def get_alerts(
    unread_only: bool = Query(False),
    current: dict = Depends(get_current_partner),
):
    db = get_supabase()

    partner = db.table("partners").select("zone").eq("id", current["partner_id"]).execute()
    if not partner.data:
        raise HTTPException(404, "Partner not found")
    zone = partner.data[0]["zone"]

    query = db.table("alerts") \
        .select("*") \
        .eq("zone", zone) \
        .order("created_at", desc=True) \
        .limit(50)

    if unread_only:
        # Filter by read status from partner_alert_reads junction table
        read_ids_result = db.table("partner_alert_reads") \
            .select("alert_id") \
            .eq("partner_id", current["partner_id"]) \
            .execute()
        read_ids = [r["alert_id"] for r in (read_ids_result.data or [])]
        # Supabase doesn't support NOT IN directly, handled in application layer

    result = query.execute()
    alerts = result.data or []

    if unread_only and read_ids:
        alerts = [a for a in alerts if a["id"] not in read_ids]

    # Annotate is_read
    read_ids_set = set()
    if result.data:
        read_result = db.table("partner_alert_reads") \
            .select("alert_id") \
            .eq("partner_id", current["partner_id"]) \
            .execute()
        read_ids_set = {r["alert_id"] for r in (read_result.data or [])}

    return [AlertOut(**a, is_read=a["id"] in read_ids_set) for a in alerts]


@router.post("/alerts/{alert_id}/read", status_code=204)
async def mark_read(alert_id: str, current: dict = Depends(get_current_partner)):
    db = get_supabase()
    db.table("partner_alert_reads").upsert({
        "partner_id": current["partner_id"],
        "alert_id": alert_id,
    }).execute()