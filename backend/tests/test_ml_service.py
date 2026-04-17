import sys
import os
import unittest
from unittest.mock import patch, MagicMock, AsyncMock

# Add backend directory to sys.path for proper module discovery
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ml_service import MLService

class TestMLService(unittest.IsolatedAsyncioTestCase):
    """
    Unit tests for the backend MLService integration.
    Verifies that the backend correctly handles responses from the ML service,
    including success scenarios, high-risk flags, and service failures.
    """
    @patch("httpx.AsyncClient.post")
    async def test_get_premium_score_success(self, mock_post):
        # Setup mock response
        mock_response = MagicMock() # Use MagicMock for response since json() is sync
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "zone": "Dwarka",
            "weekly_premium_inr": 450.0,
            "risk_tier": "LOW",
            "breakdown": {"zone_risk": 0.2}
        }
        mock_post.return_value = mock_response
        
        # Execute
        result = await MLService.get_premium_score(
            zone="Dwarka",
            work_type="full-time",
            weekly_income_inr=5000.0,
            tenure_weeks=10,
            claim_ratio=0.1
        )
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["risk_tier"], "LOW")
        self.assertEqual(result["weekly_premium_inr"], 450.0)
        mock_post.assert_called_once()

    @patch("httpx.AsyncClient.post")
    async def test_predict_fraud_block(self, mock_post):
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "claim_id": "test-claim",
            "fraud_probability": 0.95,
            "decision": "BLOCK",
            "explanation": "High velocity detected"
        }
        mock_post.return_value = mock_response
        
        # Execute
        result = await MLService.predict_fraud("test-claim", {"gps_accuracy_m": 1.0})
        
        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["decision"], "BLOCK")
        self.assertEqual(result["fraud_probability"], 0.95)

    @patch("httpx.AsyncClient.post")
    async def test_ml_service_failure(self, mock_post):
        # Setup mock failure
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        # Execute
        result = await MLService.get_premium_score("Zone", "Work", 5000, 10, 0)
        
        # Assert
        self.assertIsNone(result)

if __name__ == "__main__":
    unittest.main()
