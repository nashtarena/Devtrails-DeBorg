import sys
import os
import unittest
from unittest.mock import patch, MagicMock, AsyncMock

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.fraud_detection import run_fraud_checks

class TestIntegrationFraud(unittest.IsolatedAsyncioTestCase):
    """
    Integration tests for the fraud detection pipeline.
    Ensures that heuristics (database/Redis) and ML results (MLService)
    are correctly orchestrated to determine claim validity.
    """
    @patch("services.fraud_detection.get_supabase")
    @patch("services.fraud_detection.get_redis")
    @patch("services.fraud_detection.MLService.predict_fraud")
    @patch("services.fraud_detection.TelemetryService.get_device_telemetry")
    async def test_run_fraud_checks_integration(self, mock_telemetry, mock_ml, mock_redis, mock_db):
        # 1. Setup DB Mock
        db_inst = MagicMock()
        mock_db.return_value = db_inst
        db_inst.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"zone": "Delhi"}]
        
        # 2. Setup Redis Mock
        redis_inst = AsyncMock()
        mock_redis.return_value = redis_inst
        redis_inst.get.return_value = None # No limits hit
        redis_inst.incr.return_value = 1 # Return int for comparison
        
        # 3. Setup Telemetry Mock
        mock_telemetry.return_value = {"gps_accuracy_m": 15.0, "accel_norm": 9.8}
        
        # 4. Setup ML Mock
        mock_ml.return_value = {
            "decision": "APPROVE",
            "fraud_probability": 0.05,
            "anomaly_score": 0.1,
            "explanation": "Signals look normal"
        }
        
        # 5. Execute
        is_fraud, reason, metadata = await run_fraud_checks(
            partner_id="p1",
            zone="Delhi",
            trigger_type="heavy_rain",
            claim_id="c1"
        )
        
        # Assert
        self.assertFalse(is_fraud)
        self.assertEqual(reason, "")
        self.assertEqual(metadata["decision"], "APPROVE")
        
        # Verify ML check was called
        mock_ml.assert_called_once_with("c1", {"gps_accuracy_m": 15.0, "accel_norm": 9.8})

    @patch("services.fraud_detection.get_supabase")
    @patch("services.fraud_detection.get_redis")
    @patch("services.fraud_detection.MLService.predict_fraud")
    async def test_run_fraud_checks_rejected_by_ml(self, mock_ml, mock_redis, mock_db):
        # Setup mocks to pass heuristic checks
        db_inst = MagicMock()
        mock_db.return_value = db_inst
        db_inst.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"zone": "Delhi"}]
        redis_inst = AsyncMock()
        mock_redis.return_value = redis_inst
        redis_inst.get.return_value = None
        redis_inst.incr.return_value = 1
        
        # ML returns BLOCK
        mock_ml.return_value = {
            "decision": "BLOCK",
            "explanation": "Simulated fraud pattern"
        }
        
        # Execute
        is_fraud, reason, metadata = await run_fraud_checks(
            partner_id="p1",
            zone="Delhi",
            trigger_type="heavy_rain",
            claim_id="c_fraud",
            device_signals={"gps_accuracy_m": 0.1} # suspiciously precise
        )
        
        # Assert
        self.assertTrue(is_fraud)
        self.assertIn("ml_fraud_detected", reason)
        self.assertEqual(metadata["decision"], "BLOCK")

if __name__ == "__main__":
    unittest.main()
