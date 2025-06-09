import unittest
from unittest.mock import MagicMock, patch

from src.data_persistence_manager import DataPersistenceManager

class TestDataPersistenceManagerGraph(unittest.TestCase):
    def setUp(self):
        # Patch GraphDatabase.driver to return a mock driver
        self.driver_patcher = patch('src.data_persistence_manager.GraphDatabase.driver')
        self.mock_driver_ctor = self.driver_patcher.start()
        self.mock_driver = MagicMock()
        self.mock_driver_ctor.return_value = self.mock_driver

        # Mock session and transaction
        self.mock_session = MagicMock()
        self.mock_tx = MagicMock()
        self.mock_session.begin_transaction.return_value = self.mock_tx
        self.mock_driver.session.return_value.__enter__.return_value = self.mock_session

        # Initialize manager
        self.manager = DataPersistenceManager(neo4j_uri='bolt://mock:7687')
        # Disable qdrant for this test
        self.manager.qdrant_client = None
        self.manager.embedding_model = None

    def tearDown(self):
        self.driver_patcher.stop()

    def test_store_interaction_structured_graph(self):
        task_data = {
            'task_name': 'unit_test',
            'assistant_id': 'a1',
            'thread_id': 't1',
            'processed_at': 'now',
            'processed_by': 'tester',
            'recommendation': {'foo': 'bar'}
        }

        with patch.object(self.manager, '_expand_recommendation_json') as mock_expand:
            self.manager._store_in_neo4j('run1', 'proc1', task_data, 'ctx', [])
            mock_expand.assert_called()
            args = mock_expand.call_args[0]
            self.assertEqual(args[0], self.mock_tx)
            self.assertEqual(args[1], 'unit_test')
            self.assertEqual(args[2], 'proc1')
            # root node id prefix check
            self.assertTrue(args[4].startswith('unit_test_proc1_rec_root'))
            self.mock_tx.commit.assert_called()

if __name__ == '__main__':
    unittest.main()
