#!/usr/bin/env python3
"""
Tests for test-analytics-service service
"""

import unittest
import requests
import time

class TestTestanalyticsserviceService(unittest.TestCase):
    """Test cases for test-analytics-service service"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = "http://localhost:5000"
        self.service_name = "test-analytics-service"
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['service'], self.service_name)
            self.assertEqual(data['status'], 'healthy')
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")
    
    def test_service_info(self):
        """Test service info endpoint"""
        try:
            response = requests.get(f"{self.base_url}/info", timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['name'], self.service_name)
            self.assertIn('endpoints', data)
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")
    
    def test_process_endpoint(self):
        """Test process endpoint"""
        try:
            test_data = {"test": "data", "message": "Hello from test"}
            response = requests.post(f"{self.base_url}/process", 
                                   json=test_data, timeout=5)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data['status'], 'success')
            self.assertEqual(data['service'], self.service_name)
        except requests.exceptions.ConnectionError:
            self.skipTest("Service not running")

if __name__ == '__main__':
    unittest.main()
