import unittest
from unittest.mock import MagicMock, patch

import sys
import importlib.util

# Patch heavy dependencies before importing the module under test
sys.modules['qdrant_client'] = MagicMock()
sys.modules['qdrant_client.models'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()

spec = importlib.util.spec_from_file_location('data_persistence_manager', 'src/data_persistence_manager.py')
data_module = importlib.util.module_from_spec(spec)
sys.modules['src.data_persistence_manager'] = data_module
spec.loader.exec_module(data_module)
DataPersistenceManager = data_module.DataPersistenceManager

class TestDataPersistenceManagerGraph(unittest.TestCase):
    def setUp(self):
        # Patch GraphDatabase.driver to return a mock driver
        self.driver_patcher = patch.object(data_module.GraphDatabase, 'driver')
        self.mock_driver_ctor = self.driver_patcher.start()
        self.mock_driver = MagicMock()
        self.mock_driver_ctor.return_value = self.mock_driver

        # Mock session
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__.return_value = self.mock_session

        # Patch initialization to avoid real connections
        with patch.object(DataPersistenceManager, '_initialize_connections') as init_patch:
            init_patch.return_value = None
            self.manager = DataPersistenceManager(neo4j_uri='bolt://mock:7687')

        # Inject mock driver since initialization was skipped
        self.manager.neo4j_driver = self.mock_driver

        # Disable qdrant and embedding
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
            self.assertEqual(args[0], self.mock_session)
            self.assertEqual(args[1], 'unit_test')
            self.assertEqual(args[2], 'proc1')
            # root node id prefix check
            self.assertTrue(args[4].startswith('unit_test_proc1_rec_root'))

if __name__ == '__main__':
    unittest.main()
