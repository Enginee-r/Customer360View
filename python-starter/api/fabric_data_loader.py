"""
Enhanced DataLoader with Microsoft Fabric Lakehouse Support
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
    from config.fabric_lakehouse_config import fabric_config
    import pyodbc
    from sqlalchemy import create_engine, text
    FABRIC_AVAILABLE = True
except ImportError:
    FABRIC_AVAILABLE = False
    logging.warning("Fabric dependencies not available. Install pyodbc and sqlalchemy.")

logger = logging.getLogger(__name__)


class FabricDataLoader:
    """
    Data loader that supports local Parquet files, Microsoft Fabric Lakehouse

    Modes:
    - 'local': Load from local parquet files (development)
    - 'fabric': Load from Microsoft Fabric Lakehouse SQL endpoint (production)
    """

    def __init__(self, mode: str = None):
        self.mode = mode or os.getenv('DATA_SOURCE', 'local')
        self.cache = {}
        self.cache_time = {}
        self.cache_ttl = int(os.getenv('CACHE_TTL_SECONDS', '300'))  # Default 5 minutes

        # Local file path
        self.local_data_path = Path(__file__).parent.parent / 'data' / 'gold'

        # Fabric connection
        self.fabric_engine = None

        if self.mode == 'fabric':
            self._init_fabric_connection()

        logger.info(f"DataLoader initialized in '{self.mode}' mode")

    def _init_fabric_connection(self):
        """Initialize Microsoft Fabric Lakehouse connection"""
        if not FABRIC_AVAILABLE:
            raise ImportError(
                "Fabric dependencies not installed. "
                "Run: pip install pyodbc sqlalchemy"
            )

        if not fabric_config.validate():
            raise ValueError(
                "Invalid Fabric configuration. Check your environment variables.\n"
                f"Current config: {fabric_config.get_workspace_info()}"
            )

        try:
            conn_url = fabric_config.get_sqlalchemy_url()
            self.fabric_engine = create_engine(
                conn_url,
                pool_size=fabric_config.pool_size,
                pool_timeout=fabric_config.pool_timeout,
                pool_pre_ping=True,  # Verify connections before using
                echo=False
            )

            # Test connection
            with self.fabric_engine.connect() as conn:
                result = conn.execute(text("SELECT @@VERSION as version"))
                version = result.scalar()
                logger.info(f"Fabric connection established: {version[:50]}...")

        except Exception as e:
            logger.error(f"Failed to connect to Fabric Lakehouse: {e}")
            logger.error(f"SQL Endpoint: {fabric_config.sql_endpoint}")
            logger.error(f"Lakehouse: {fabric_config.lakehouse_name}")
            raise

    def load_latest(self, table_name: str) -> pd.DataFrame:
        """
        Load latest version of a table from configured data source

        Args:
            table_name: Name of the table (e.g., 'customer_360_metrics')

        Returns:
            DataFrame with table data
        """
        # Check cache first
        cache_key = f"{self.mode}:{table_name}"
        if cache_key in self.cache:
            age = (datetime.now() - self.cache_time[cache_key]).seconds
            if age < self.cache_ttl:
                logger.debug(f"Cache hit for {table_name} (age: {age}s)")
                return self.cache[cache_key].copy()  # Return copy to avoid mutations

        # Load from appropriate source
        if self.mode == 'fabric':
            df = self._load_from_fabric(table_name)
        else:
            df = self._load_from_local(table_name)

        # Cache the result
        if not df.empty:
            self.cache[cache_key] = df
            self.cache_time[cache_key] = datetime.now()
            logger.info(f"Cached {len(df)} rows for {table_name}")

        return df.copy()

    def _load_from_local(self, table_name: str) -> pd.DataFrame:
        """Load from local Parquet files"""
        pattern = f"gold_{table_name}_*.parquet"
        files = list(self.local_data_path.glob(pattern))

        if not files:
            logger.warning(f"No local files found matching: {pattern}")
            return pd.DataFrame()

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading from local file: {latest_file.name}")

        try:
            df = pd.read_parquet(latest_file)
            return df
        except Exception as e:
            logger.error(f"Error loading local file {latest_file}: {e}")
            return pd.DataFrame()

    def _load_from_fabric(self, table_name: str) -> pd.DataFrame:
        """Load from Microsoft Fabric Lakehouse SQL endpoint"""
        if not self.fabric_engine:
            raise RuntimeError("Fabric engine not initialized")

        schema = fabric_config.schema
        full_table_name = f"[{schema}].[{table_name}]"

        logger.info(f"Loading from Fabric table: {full_table_name}")

        try:
            # Use parameterized query for safety
            query = text(f"SELECT * FROM {full_table_name}")

            df = pd.read_sql(query, self.fabric_engine)

            logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns from {full_table_name}")

            return df

        except Exception as e:
            logger.error(f"Error loading from Fabric: {e}")
            logger.error(f"Table: {full_table_name}")

            # Check if table exists
            try:
                check_query = text("""
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table
                """)
                result = pd.read_sql(check_query, self.fabric_engine, params={'schema': schema, 'table': table_name})

                if result.empty:
                    logger.error(f"Table {full_table_name} does not exist in Fabric Lakehouse")
            except:
                pass

            return pd.DataFrame()

    def execute_query(self, query: str, params: dict = None) -> pd.DataFrame:
        """
        Execute custom SQL query (Fabric mode only)

        Args:
            query: SQL query to execute
            params: Optional query parameters

        Returns:
            DataFrame with query results
        """
        if self.mode != 'fabric':
            raise RuntimeError("execute_query() only available in Fabric mode")

        if not self.fabric_engine:
            raise RuntimeError("Fabric engine not initialized")

        try:
            if params:
                df = pd.read_sql(text(query), self.fabric_engine, params=params)
            else:
                df = pd.read_sql(query, self.fabric_engine)

            logger.info(f"Query executed: {len(df)} rows returned")
            return df

        except Exception as e:
            logger.error(f"Error executing query: {e}")
            logger.error(f"Query: {query[:200]}...")
            return pd.DataFrame()

    def refresh_cache(self, table_name: Optional[str] = None):
        """
        Manually refresh cache for a specific table or all tables

        Args:
            table_name: Specific table to refresh, or None for all
        """
        if table_name:
            cache_key = f"{self.mode}:{table_name}"
            if cache_key in self.cache:
                del self.cache[cache_key]
                del self.cache_time[cache_key]
                logger.info(f"Cache cleared for {table_name}")
        else:
            count = len(self.cache)
            self.cache.clear()
            self.cache_time.clear()
            logger.info(f"Cleared {count} cached tables")

    def get_available_tables(self) -> list:
        """Get list of available tables"""
        if self.mode == 'fabric':
            return self._get_fabric_tables()
        else:
            return self._get_local_tables()

    def _get_local_tables(self) -> list:
        """Get list of local parquet files"""
        if not self.local_data_path.exists():
            logger.warning(f"Local data path does not exist: {self.local_data_path}")
            return []

        files = list(self.local_data_path.glob("gold_*.parquet"))
        tables = set()

        for f in files:
            # Extract table name: gold_<table_name>_<timestamp>.parquet
            name = f.stem
            parts = name.split('_')
            if len(parts) >= 2:
                # Handle names like gold_customer_360_metrics_20241028.parquet
                if len(parts) > 2:
                    table_name = '_'.join(parts[1:-1])
                else:
                    table_name = parts[1]
                tables.add(table_name)

        return sorted(list(tables))

    def _get_fabric_tables(self) -> list:
        """Get list of tables from Fabric Lakehouse"""
        if not self.fabric_engine:
            return []

        schema = fabric_config.schema

        query = text("""
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = :schema
            AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)

        try:
            df = pd.read_sql(query, self.fabric_engine, params={'schema': schema})
            tables = df['TABLE_NAME'].tolist()
            logger.info(f"Found {len(tables)} tables in Fabric Lakehouse schema '{schema}'")
            return tables
        except Exception as e:
            logger.error(f"Error getting Fabric tables: {e}")
            return []

    def get_table_info(self, table_name: str) -> dict:
        """Get detailed information about a table"""
        if self.mode != 'fabric':
            return {'mode': 'local', 'available': table_name in self.get_available_tables()}

        schema = fabric_config.schema

        query = text("""
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = :schema
            AND TABLE_NAME = :table
            ORDER BY ORDINAL_POSITION
        """)

        try:
            df = pd.read_sql(query, self.fabric_engine, params={'schema': schema, 'table': table_name})

            return {
                'table_name': table_name,
                'schema': schema,
                'columns': df.to_dict('records'),
                'column_count': len(df)
            }
        except Exception as e:
            logger.error(f"Error getting table info: {e}")
            return {'error': str(e)}

    def health_check(self) -> dict:
        """Check health of data source connection"""
        status = {
            'mode': self.mode,
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'details': {}
        }

        if self.mode == 'fabric':
            try:
                with self.fabric_engine.connect() as conn:
                    # Get Fabric version
                    result = conn.execute(text("SELECT @@VERSION as version"))
                    version = result.scalar()
                    status['details']['fabric_version'] = version[:100]

                    # Get current database
                    result = conn.execute(text("SELECT DB_NAME() as db"))
                    status['details']['current_database'] = result.scalar()

                    # Get row count for a key table
                    tables = self.get_available_tables()
                    if 'customer_360_metrics' in tables:
                        result = conn.execute(text(f"SELECT COUNT(*) FROM [{fabric_config.schema}].[customer_360_metrics]"))
                        status['details']['customer_count'] = result.scalar()

                    status['details']['connected'] = True
                    status['details']['sql_endpoint'] = fabric_config.sql_endpoint
                    status['details']['lakehouse'] = fabric_config.lakehouse_name

            except Exception as e:
                status['status'] = 'unhealthy'
                status['details']['error'] = str(e)
                logger.error(f"Health check failed: {e}")
        else:
            status['details']['local_path'] = str(self.local_data_path)
            status['details']['path_exists'] = self.local_data_path.exists()

        # Add cache info
        status['details']['cached_tables'] = len(self.cache)
        status['details']['cache_ttl_seconds'] = self.cache_ttl
        status['details']['available_tables'] = self.get_available_tables()

        return status

    def __del__(self):
        """Cleanup connection on deletion"""
        if self.fabric_engine:
            self.fabric_engine.dispose()
