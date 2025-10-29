"""
Enhanced DataLoader with Azure Synapse Support
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import pandas as pd
import logging

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

try:
    from config.synapse_config import synapse_config
    import pyodbc
    from sqlalchemy import create_engine, text
    SYNAPSE_AVAILABLE = True
except ImportError:
    SYNAPSE_AVAILABLE = False
    logging.warning("Synapse dependencies not available. Install pyodbc and sqlalchemy.")

logger = logging.getLogger(__name__)


class HybridDataLoader:
    """
    Data loader that supports both local Parquet files and Azure Synapse

    Modes:
    - 'local': Load from local parquet files (development)
    - 'synapse': Load from Azure Synapse (production)
    """

    def __init__(self, mode: str = None):
        self.mode = mode or os.getenv('DATA_SOURCE', 'local')
        self.cache = {}
        self.cache_time = {}
        self.cache_ttl = 300  # 5 minutes

        # Local file path
        self.local_data_path = Path(__file__).parent.parent / 'data' / 'gold'

        # Synapse connection
        self.synapse_engine = None

        if self.mode == 'synapse':
            self._init_synapse_connection()

        logger.info(f"DataLoader initialized in '{self.mode}' mode")

    def _init_synapse_connection(self):
        """Initialize Synapse connection"""
        if not SYNAPSE_AVAILABLE:
            raise ImportError(
                "Synapse dependencies not installed. "
                "Run: pip install pyodbc sqlalchemy"
            )

        if not synapse_config.validate():
            raise ValueError(
                "Invalid Synapse configuration. "
                "Check your environment variables."
            )

        try:
            conn_url = synapse_config.get_sqlalchemy_url()
            self.synapse_engine = create_engine(
                conn_url,
                pool_size=synapse_config.pool_size,
                pool_timeout=synapse_config.pool_timeout,
                echo=False
            )

            # Test connection
            with self.synapse_engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            logger.info("Synapse connection established successfully")

        except Exception as e:
            logger.error(f"Failed to connect to Synapse: {e}")
            raise

    def load_latest(self, table_name: str) -> pd.DataFrame:
        """
        Load latest version of a table from configured data source

        Args:
            table_name: Name of the table (without 'gold_' prefix)

        Returns:
            DataFrame with table data
        """
        # Check cache first
        if table_name in self.cache:
            age = (datetime.now() - self.cache_time[table_name]).seconds
            if age < self.cache_ttl:
                logger.debug(f"Cache hit for {table_name} (age: {age}s)")
                return self.cache[table_name]

        # Load from appropriate source
        if self.mode == 'synapse':
            df = self._load_from_synapse(table_name)
        else:
            df = self._load_from_local(table_name)

        # Cache the result
        if not df.empty:
            self.cache[table_name] = df
            self.cache_time[table_name] = datetime.now()

        return df

    def _load_from_local(self, table_name: str) -> pd.DataFrame:
        """Load from local Parquet files"""
        pattern = f"gold_{table_name}_*.parquet"
        files = list(self.local_data_path.glob(pattern))

        if not files:
            logger.warning(f"No local files found for {table_name}")
            return pd.DataFrame()

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading from local file: {latest_file}")

        return pd.read_parquet(latest_file)

    def _load_from_synapse(self, table_name: str) -> pd.DataFrame:
        """Load from Azure Synapse"""
        if not self.synapse_engine:
            raise RuntimeError("Synapse engine not initialized")

        schema = synapse_config.gold_schema
        full_table_name = f"{schema}.{table_name}"

        logger.info(f"Loading from Synapse table: {full_table_name}")

        try:
            query = f"SELECT * FROM {full_table_name}"
            df = pd.read_sql(query, self.synapse_engine)

            logger.info(f"Loaded {len(df)} rows from {full_table_name}")
            return df

        except Exception as e:
            logger.error(f"Error loading from Synapse: {e}")
            return pd.DataFrame()

    def execute_query(self, query: str) -> pd.DataFrame:
        """
        Execute custom SQL query (Synapse mode only)

        Args:
            query: SQL query to execute

        Returns:
            DataFrame with query results
        """
        if self.mode != 'synapse':
            raise RuntimeError("execute_query() only available in Synapse mode")

        if not self.synapse_engine:
            raise RuntimeError("Synapse engine not initialized")

        try:
            df = pd.read_sql(query, self.synapse_engine)
            return df
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return pd.DataFrame()

    def refresh_cache(self, table_name: Optional[str] = None):
        """
        Manually refresh cache for a specific table or all tables

        Args:
            table_name: Specific table to refresh, or None for all
        """
        if table_name:
            if table_name in self.cache:
                del self.cache[table_name]
                del self.cache_time[table_name]
                logger.info(f"Cache cleared for {table_name}")
        else:
            self.cache.clear()
            self.cache_time.clear()
            logger.info("All caches cleared")

    def get_available_tables(self) -> list:
        """Get list of available tables"""
        if self.mode == 'synapse':
            return self._get_synapse_tables()
        else:
            return self._get_local_tables()

    def _get_local_tables(self) -> list:
        """Get list of local parquet files"""
        files = list(self.local_data_path.glob("gold_*.parquet"))
        tables = set()

        for f in files:
            # Extract table name: gold_<table_name>_<timestamp>.parquet
            name = f.stem
            parts = name.split('_')
            if len(parts) >= 2:
                table_name = '_'.join(parts[1:-1]) or parts[1]
                tables.add(table_name)

        return sorted(list(tables))

    def _get_synapse_tables(self) -> list:
        """Get list of tables from Synapse schema"""
        if not self.synapse_engine:
            return []

        schema = synapse_config.gold_schema
        query = f"""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = '{schema}'
        ORDER BY TABLE_NAME
        """

        try:
            df = pd.read_sql(query, self.synapse_engine)
            return df['TABLE_NAME'].tolist()
        except Exception as e:
            logger.error(f"Error getting Synapse tables: {e}")
            return []

    def health_check(self) -> dict:
        """Check health of data source connection"""
        status = {
            'mode': self.mode,
            'status': 'healthy',
            'details': {}
        }

        if self.mode == 'synapse':
            try:
                with self.synapse_engine.connect() as conn:
                    result = conn.execute(text("SELECT @@VERSION"))
                    status['details']['synapse_version'] = result.scalar()
                    status['details']['connected'] = True
            except Exception as e:
                status['status'] = 'unhealthy'
                status['details']['error'] = str(e)
        else:
            status['details']['local_path'] = str(self.local_data_path)
            status['details']['exists'] = self.local_data_path.exists()

        status['details']['cached_tables'] = list(self.cache.keys())
        status['details']['available_tables'] = self.get_available_tables()

        return status
