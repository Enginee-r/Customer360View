"""
Azure Synapse Connection Configuration
"""

import os
from typing import Optional

class SynapseConfig:
    """Configuration for Azure Synapse connectivity"""

    def __init__(self):
        # Azure Synapse connection details from environment variables
        self.server = os.getenv('SYNAPSE_SERVER', 'your-workspace.sql.azuresynapse.net')
        self.database = os.getenv('SYNAPSE_DATABASE', 'your_database')
        self.username = os.getenv('SYNAPSE_USERNAME', '')
        self.password = os.getenv('SYNAPSE_PASSWORD', '')

        # Authentication method: 'sql' or 'aad' (Azure Active Directory)
        self.auth_method = os.getenv('SYNAPSE_AUTH_METHOD', 'sql')

        # For Azure AD authentication
        self.tenant_id = os.getenv('AZURE_TENANT_ID', '')
        self.client_id = os.getenv('AZURE_CLIENT_ID', '')
        self.client_secret = os.getenv('AZURE_CLIENT_SECRET', '')

        # Connection string options
        self.driver = os.getenv('SYNAPSE_DRIVER', '{ODBC Driver 17 for SQL Server}')
        self.port = os.getenv('SYNAPSE_PORT', '1433')

        # Schema where gold layer tables are stored
        self.gold_schema = os.getenv('SYNAPSE_GOLD_SCHEMA', 'gold')

        # Connection pool settings
        self.pool_size = int(os.getenv('SYNAPSE_POOL_SIZE', '5'))
        self.pool_timeout = int(os.getenv('SYNAPSE_POOL_TIMEOUT', '30'))

    def get_connection_string(self) -> str:
        """Generate ODBC connection string based on auth method"""

        base_conn = (
            f"DRIVER={self.driver};"
            f"SERVER={self.server};"
            f"PORT={self.port};"
            f"DATABASE={self.database};"
        )

        if self.auth_method == 'sql':
            # SQL Authentication
            return base_conn + f"UID={self.username};PWD={self.password};"

        elif self.auth_method == 'aad':
            # Azure Active Directory authentication
            return base_conn + "Authentication=ActiveDirectoryServicePrincipal;"

        else:
            raise ValueError(f"Unsupported auth method: {self.auth_method}")

    def get_sqlalchemy_url(self) -> str:
        """Generate SQLAlchemy URL for connection"""
        from urllib.parse import quote_plus

        conn_str = self.get_connection_string()
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(conn_str)}"

    def validate(self) -> bool:
        """Validate that required configuration is present"""
        if not self.server or not self.database:
            return False

        if self.auth_method == 'sql':
            return bool(self.username and self.password)

        elif self.auth_method == 'aad':
            return bool(self.tenant_id and self.client_id and self.client_secret)

        return False


# Global config instance
synapse_config = SynapseConfig()
