import httpx
import logging
from typing import Optional, Dict, Any
from config import get_settings

settings = get_settings()
logger = logging.getLogger("backend.ml_service")

class MLService:
    @staticmethod
    async def get_premium_score(
        zone: str,
        work_type: str,
        weekly_income_inr: float,
        tenure_weeks: int,
        claim_ratio: float
    ) -> Optional[Dict[str, Any]]:
        """
        Calls ML model to calculate premium and risk tier.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.ML_SERVICE_URL}/ml/score/premium",
                    json={
                        "zone": zone,
                        "work_type": work_type,
                        "weekly_income_inr": weekly_income_inr,
                        "tenure_weeks": tenure_weeks,
                        "claim_ratio": claim_ratio,
                    },
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.error(f"ML Premium scoring failed with status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.exception(f"ML Premium scoring call failed: {e}")
        return None

    @staticmethod
    async def calculate_claim_amount(
        trigger_type: str,
        severity: float,
        weekly_income_inr: float
    ) -> Optional[Dict[str, Any]]:
        """
        Calls ML model to calculate claim payout amount based on severity.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.ML_SERVICE_URL}/ml/score/claim",
                    json={
                        "trigger_type": trigger_type,
                        "severity": severity,
                        "weekly_income_inr": weekly_income_inr,
                    },
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.error(f"ML Claim scoring failed with status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.exception(f"ML Claim scoring call failed: {e}")
        return None

    @staticmethod
    async def predict_fraud(
        claim_id: str,
        device_signals: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Calls ML model to predict fraud for a specific claim.
        """
        try:
            payload = {"claim_id": claim_id, **device_signals}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.ML_SERVICE_URL}/ml/score/fraud",
                    json=payload,
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.error(f"ML Fraud scoring failed with status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.exception(f"ML Fraud scoring call failed: {e}")
        return None

    @staticmethod
    async def validate_location(
        worker_id: str,
        device_signals: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Lightweight location pre-check using ML rules.
        """
        try:
            payload = {
                "worker_id": worker_id,
                "gps_accuracy_m": device_signals.get("gps_accuracy_m", 15.0),
                "accel_norm": device_signals.get("accel_norm", 9.8),
                "network_type": device_signals.get("network_type", 1),
                "battery_drain_pct_per_hr": device_signals.get("battery_drain_pct_per_hr", 10.0),
            }
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(
                    f"{settings.ML_SERVICE_URL}/ml/validate/location",
                    json=payload,
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.error(f"ML Location validation call failed: {e}")
        return None
