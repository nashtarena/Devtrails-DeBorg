import unittest
import sys
import os

# Add parent dir to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from premium_model import predict_premium, load_premium_model
from claim_model import predict_claim_amount, load_claim_model

class TestMLModels(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Load models once for all tests
        cls.premium_model, cls.premium_encoder = load_premium_model()
        cls.claim_model, cls.claim_encoder = load_claim_model()

    def test_premium_prediction(self):
        result = predict_premium(
            zone="Dwarka",
            work_type="full-time",
            weekly_income_inr=5000.0,
            tenure_weeks=10,
            claim_ratio=0.0,
            model=self.premium_model,
            encoder=self.premium_encoder
        )
        self.assertEqual(result.zone, "Dwarka")
        self.assertGreater(result.weekly_premium_inr, 0)
        self.assertIn(result.risk_tier, ["LOW", "MEDIUM", "HIGH"])

    def test_claim_prediction(self):
        result = predict_claim_amount(
            trigger_type="heavy_rain",
            severity=0.8,
            weekly_income_inr=5000.0,
            model=self.claim_model,
            encoder=self.claim_encoder
        )
        self.assertEqual(result.trigger_type, "heavy_rain")
        self.assertGreater(result.claim_amount, 0)
        self.assertIn("heavy rain", result.explanation.lower())

if __name__ == "__main__":
    unittest.main()
