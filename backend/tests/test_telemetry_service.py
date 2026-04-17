import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.telemetry_service import TelemetryService

class TestTelemetryService(unittest.TestCase):
    """
    Unit tests for the TelemetryService.
    Verifies computed analytics logic including standard deviation calculations
    and zone claim spike ratios.
    """
    def test_calculate_claim_time_std(self):
        # 1. Test with two points exactly 60 units apart (1 hour)
        # Standard deviation of a single interval should be 0.0 or handleable
        # Standard deviation of [60, 60] is 0
        timestamps = [1000, 1000 + 3600, 1000 + 7200] # Intervals: 60 min, 60 min
        std = TelemetryService.calculate_claim_time_std(timestamps)
        self.assertEqual(std, 0.0)
        
        # 2. Test with variable intervals
        # Intervals: 10 min, 50 min
        timestamps = [1000, 1000 + 600, 1000 + 3600] 
        std = TelemetryService.calculate_claim_time_std(timestamps)
        # intervals = [10.0, 50.0] -> mean = 30.0, stdev = sqrt(((10-30)^2 + (50-30)^2)/(2-1)) = sqrt(400+400) = sqrt(800) approx 28.28
        self.assertAlmostEqual(std, 28.284271247, places=5)

    def test_calculate_claim_time_std_empty(self):
        self.assertEqual(TelemetryService.calculate_claim_time_std([]), 0.0)
        self.assertEqual(TelemetryService.calculate_claim_time_std([1000]), 0.0)

    def test_calculate_zone_claim_spike_ratio(self):
        # Normal case
        self.assertEqual(TelemetryService.calculate_zone_claim_spike_ratio(10, 5.0), 2.0)
        # Zero baseline
        self.assertEqual(TelemetryService.calculate_zone_claim_spike_ratio(10, 0.0), 1.0)
        # Zero current and zero baseline
        self.assertEqual(TelemetryService.calculate_zone_claim_spike_ratio(0, 0.0), 0.0)
        # Low spike
        self.assertEqual(TelemetryService.calculate_zone_claim_spike_ratio(1, 5.0), 0.2)

if __name__ == "__main__":
    unittest.main()
