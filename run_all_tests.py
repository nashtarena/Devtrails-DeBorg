import unittest
import sys
import os

def run_tests():
    """
    Consolidated test runner for the Devtrails-DeBorg project.
    Runs ML model tests and Backend service/integration tests.
    """
    print("=== Running Devtrails-DeBorg Project Tests ===\n")
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # 1. Discover Backend Tests
    backend_tests = loader.discover(
        start_dir=os.path.join(os.getcwd(), 'backend', 'tests'),
        pattern='test_*.py'
    )
    suite.addTests(backend_tests)

    # 2. Discover ML Tests
    ml_tests = loader.discover(
        start_dir=os.path.join(os.getcwd(), 'ml', 'tests'),
        pattern='test_*.py'
    )
    suite.addTests(ml_tests)

    # 3. Execute
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
