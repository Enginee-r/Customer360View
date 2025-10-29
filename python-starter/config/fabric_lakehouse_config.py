"""
Microsoft Fabric Lakehouse Connection Configuration
"""

import os
from typing import Optional

class FabricLakehouseConfig:
    """Configuration for Microsoft Fabric Lakehouse connectivity"""

    def __init__(self):
        # Microsoft Fabric Lakehouse connection details
        # Format: <workspace-id>.datawarehouse.fabric.microsoft.com
        # Or: <workspace-name>.datawarehouse.pbidedicated.windows.net
        self.sql_endpoint = os.getenv('FABRIC_SQL_ENDPOINT', 'your-workspace.datawarehouse.fabric.microsoft.com')
        self.lakehouse_name = os.getenv('FABRIC_LAKEHOUSE_NAME', 'your_lakehouse')

        # Port (usually 1433 for SQL endpoint)
        self.port = os.getenv('FABRIC_PORT', '1433')

        # Authentication method: 'aad' (recommended) or 'sql'
        # Note: Fabric strongly recommends Azure AD authentication
        self.auth_method = os.getenv('FABRIC_AUTH_METHOD', 'aad')

        # For Azure AD authentication (recommended)
        self.tenant_id = os.getenv('AZURE_TENANT_ID', '')
        self.client_id = os.getenv('AZURE_CLIENT_ID', '')
        self.client_secret = os.getenv('AZURE_CLIENT_SECRET', '')

        # For SQL authentication (if enabled in your Fabric workspace)
        self.username = os.getenv('FABRIC_USERNAME', '')
        self.password = os.getenv('FABRIC_PASSWORD', '')

        # ODBC Driver
        self.driver = os.getenv('FABRIC_DRIVER', '{ODBC Driver 18 for SQL Server}')

        # Schema where tables are stored (default is dbo for Fabric)
        # In Fabric, tables are typically in dbo schema or custom schemas
        self.schema = os.getenv('FABRIC_SCHEMA', 'dbo')

        # Connection pool settings
        self.pool_size = int(os.getenv('FABRIC_POOL_SIZE', '5'))
        self.pool_timeout = int(os.getenv('FABRIC_POOL_TIMEOUT', '30'))

        # Fabric-specific: Use Encrypt and TrustServerCertificate
        self.encrypt = os.getenv('FABRIC_ENCRYPT', 'yes')
        self.trust_server_certificate = os.getenv('FABRIC_TRUST_CERT', 'no')

        # Optional: Direct lakehouse endpoint (for OneLake access)
        self.onelake_endpoint = os.getenv('FABRIC_ONELAKE_ENDPOINT', '')
        self.workspace_id = os.getenv('FABRIC_WORKSPACE_ID', '')
        self.lakehouse_id = os.getenv('FABRIC_LAKEHOUSE_ID', '')

    def get_connection_string(self) -> str:
        """Generate ODBC connection string for Fabric SQL endpoint"""

        base_conn = (
            f"DRIVER={self.driver};"
            f"SERVER={self.sql_endpoint},{self.port};"
            f"DATABASE={self.lakehouse_name};"
            f"Encrypt={self.encrypt};"
            f"TrustServerCertificate={self.trust_server_certificate};"
        )

        if self.auth_method == 'aad':
            # Azure Active Directory authentication
            return base_conn + "Authentication=ActiveDirectoryServicePrincipal;"
        elif self.auth_method == 'sql':
            # SQL Authentication
            return base_conn + f"UID={self.username};PWD={self.password};"
        else:
            raise ValueError(f"Unsupported auth method: {self.auth_method}")

    def get_sqlalchemy_url(self) -> str:
        """Generate SQLAlchemy URL for Fabric connection"""
        from urllib.parse import quote_plus

        conn_str = self.get_connection_string()
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(conn_str)}"

    def get_onelake_path(self, table_name: str) -> str:
        """
        Get OneLake ABFS path for direct Delta Lake access
        Format: abfss://<workspace-id>@onelake.dfs.fabric.microsoft.com/<lakehouse-name>/Tables/<table-name>
        """
        if not self.workspace_id or not self.lakehouse_id:
            raise ValueError("Workspace ID and Lakehouse ID required for OneLake access")

        return (
            f"abfss://{self.workspace_id}@onelake.dfs.fabric.microsoft.com/"
            f"{self.lakehouse_name}/Tables/{table_name}"
        )

    def validate(self) -> bool:
        """Validate that required configuration is present"""
        if not self.sql_endpoint or not self.lakehouse_name:
            return False

        if self.auth_method == 'aad':
            return bool(self.tenant_id and self.client_id and self.client_secret)
        elif self.auth_method == 'sql':
            return bool(self.username and self.password)

        return False

    def get_workspace_info(self) -> dict:
        """Return workspace configuration info"""
        return {
            'sql_endpoint': self.sql_endpoint,
            'lakehouse_name': self.lakehouse_name,
            'auth_method': self.auth_method,
            'schema': self.schema,
            'workspace_id': self.workspace_id,
            'lakehouse_id': self.lakehouse_id
        }


# Global config instance
fabric_config = FabricLakehouseConfig()
