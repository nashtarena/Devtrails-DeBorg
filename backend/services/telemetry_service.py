import math
import statistics
from datetime import datetime
from typing import List, Dict, Any, Optional
from database import get_supabase
from cache import get_redis
import logging

logger = logging.getLogger("backend.telemetry_service")

class TelemetryService:
    @staticmethod
    def calculate_claim_time_std(timestamps: List[float]) -> float:
        """
        Calculates standard deviation of intervals between claim events in minutes.
        Expects a list of unix timestamps.
        """
        if len(timestamps) < 2:
            return 0.0
        
        # Calculate intervals in minutes
        sorted_ts = sorted(timestamps)
        intervals = []
        for i in range(1, len(sorted_ts)):
            interval_min = (sorted_ts[i] - sorted_ts[i-1]) / 60.0
            intervals.append(interval_min)
            
        if not intervals:
            return 0.0
        
        if len(intervals) == 1:
            return 0.0
            
        return float(statistics.stdev(intervals))

    @staticmethod
    def calculate_zone_claim_spike_ratio(current_zone_count: int, baseline_avg: float) -> float:
        """
        Calculates the ratio of current claims to the baseline average.
        """
        if baseline_avg <= 0:
            return 1.0 if current_zone_count > 0 else 0.0
        return float(current_zone_count) / baseline_avg

    @staticmethod
    async def get_device_telemetry(partner_id: str, zone: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves the latest telemetry for a partner/device.
        Used to populate device signals for fraud scoring.
        Calculates computed analytics on the fly if needed.
        """
        redis = await get_redis()
        telemetry_json = await redis.get(f"telemetry:{partner_id}")
        telemetry = {}
        if telemetry_json:
            import json
            telemetry = json.loads(telemetry_json)
        
        # 1. Calculate Standard Deviation of last 10 claim intervals
        ts_key = f"telemetry:claim_timestamps:{partner_id}"
        timestamps_bytes = await redis.lrange(ts_key, 0, 9)
        if timestamps_bytes:
            timestamps = [float(ts) for ts in timestamps_bytes]
            telemetry["claim_time_std_minutes"] = TelemetryService.calculate_claim_time_std(timestamps)
        else:
            telemetry["claim_time_std_minutes"] = telemetry.get("claim_time_std_minutes", 0.0)

        # 2. Calculate Zone Spike Ratio
        if zone:
            # Get current claims in zone (last 10 mins)
            ring_key = f"ring:{zone}:heavy_rain" # or dynamic trigger
            current_count_str = await redis.get(ring_key)
            current_count = int(current_count_str) if current_count_str else 0
            
            # Baseline is usually stored in DB or config
            baseline_avg = 5.0 # Example baseline
            telemetry["zone_claim_spike_ratio"] = TelemetryService.calculate_zone_claim_spike_ratio(current_count, baseline_avg)
        else:
            telemetry["zone_claim_spike_ratio"] = telemetry.get("zone_claim_spike_ratio", 1.0)

        # Fill in other defaults if missing
        defaults = {
            "gps_accuracy_m": 15.0,
            "accel_norm": 9.8,
            "location_velocity_kmh": 0.0,
            "network_type": 1,
            "battery_drain_pct_per_hr": 5.0,
            "order_acceptance_latency_s": 30.0,
            "peer_claims_same_window": 0,
            "device_subnet_overlap": 0,
        }
        for k, v in defaults.items():
            if k not in telemetry:
                telemetry[k] = v
                
        return telemetry

    @staticmethod
    async def save_telemetry(partner_id: str, data: Dict[str, Any]):
        """
        Saves telemetry data to Redis for quick access and potentially to DB for history.
        """
        redis = await get_redis()
        import json
        
        # Add timestamp if not present
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow().isoformat()
            
        await redis.setex(f"telemetry:{partner_id}", 3600, json.dumps(data))
        
        # Track last 10 claim timestamps for STD calculation
        if data.get("is_claim_event"):
            ts_key = f"telemetry:claim_timestamps:{partner_id}"
            now = datetime.utcnow().timestamp()
            await redis.lpush(ts_key, now)
            await redis.ltrim(ts_key, 0, 9) # Keep only last 10
