"""
Bronze Layer Extraction Script
Extracts data from Salesforce and saves to lakehouse bronze layer
"""

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
from simple_salesforce import Salesforce, SalesforceLogin
import pyarrow as pa
import pyarrow.parquet as pq

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SalesforceBronzeExtractor:
    """Extract Salesforce data to Bronze layer"""

    SOQL_QUERIES = {
        'account': """
            SELECT Id, Name, Type, BillingCountry, BillingState,
                   AnnualRevenue, Industry, NumberOfEmployees,
                   CreatedDate, LastModifiedDate, OwnerId,
                   ParentId, AccountSource, Rating, Phone, Website
            FROM Account
        """,
        'opportunity': """
            SELECT Id, Name, AccountId, Amount, StageName,
                   CloseDate, Probability, Type, LeadSource,
                   CreatedDate, LastModifiedDate, OwnerId,
                   IsClosed, IsWon, ForecastCategory,
                   ExpectedRevenue, Description
            FROM Opportunity
        """,
        'opportunity_line_item': """
            SELECT Id, OpportunityId, ProductCode, Product2Id,
                   Quantity, UnitPrice, TotalPrice, Discount,
                   ServiceDate, Description, CreatedDate,
                   LastModifiedDate
            FROM OpportunityLineItem
        """,
        'contact': """
            SELECT Id, AccountId, FirstName, LastName, Email,
                   Phone, Title, Department, MobilePhone,
                   CreatedDate, LastModifiedDate, OwnerId,
                   MailingCountry, MailingState, MailingCity
            FROM Contact
        """
    }

    def __init__(self, config_path: str):
        """Initialize with Salesforce credentials from config"""
        with open(config_path, 'r') as f:
            config = json.load(f)

        sf_config = config['salesforce']

        # Authenticate to Salesforce
        session_id, instance = SalesforceLogin(
            username=sf_config['username'],
            password=sf_config['password'],
            security_token=sf_config['security_token']
        )

        self.sf = Salesforce(instance=instance, session_id=session_id)
        self.output_path = Path(config.get('bronze_path', './data/bronze'))
        self.output_path.mkdir(parents=True, exist_ok=True)

        logger.info(f"Connected to Salesforce instance: {instance}")

    def extract_table(self, table_name: str) -> pd.DataFrame:
        """Extract a single table from Salesforce"""
        logger.info(f"Extracting {table_name}...")

        query = self.SOQL_QUERIES.get(table_name)
        if not query:
            raise ValueError(f"No query defined for table: {table_name}")

        # Execute SOQL query
        result = self.sf.query_all(query)
        records = result['records']

        # Remove Salesforce metadata
        for record in records:
            record.pop('attributes', None)

        df = pd.DataFrame(records)

        # Add extraction metadata
        df['_extracted_at'] = datetime.utcnow()
        df['_source_system'] = 'salesforce'
        df['_bronze_layer'] = True

        logger.info(f"Extracted {len(df)} records from {table_name}")
        return df

    def save_to_parquet(self, df: pd.DataFrame, table_name: str) -> str:
        """Save DataFrame to Parquet format with partitioning"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"bronze_{table_name}_{timestamp}.parquet"
        filepath = self.output_path / filename

        # Convert to PyArrow table for better compression
        table = pa.Table.from_pandas(df)

        pq.write_table(
            table,
            filepath,
            compression='snappy',
            use_dictionary=True,
            write_statistics=True
        )

        logger.info(f"Saved to: {filepath}")
        return str(filepath)

    def extract_tables(self, tables: List[str]) -> Dict[str, Any]:
        """Extract multiple tables and return metrics"""
        metrics = {
            'start_time': datetime.utcnow().isoformat(),
            'tables_processed': [],
            'total_records': 0,
            'files_created': []
        }

        for table in tables:
            try:
                df = self.extract_table(table)
                filepath = self.save_to_parquet(df, table)

                metrics['tables_processed'].append({
                    'table': table,
                    'records': len(df),
                    'file': filepath
                })
                metrics['total_records'] += len(df)
                metrics['files_created'].append(filepath)

            except Exception as e:
                logger.error(f"Error extracting {table}: {str(e)}")
                metrics['tables_processed'].append({
                    'table': table,
                    'error': str(e)
                })

        metrics['end_time'] = datetime.utcnow().isoformat()

        # Save metrics
        metrics_file = self.output_path / f"extraction_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)

        logger.info(f"Extraction complete. Metrics saved to: {metrics_file}")
        return metrics


def main():
    parser = argparse.ArgumentParser(description='Extract Salesforce data to Bronze layer')
    parser.add_argument(
        '--tables',
        type=str,
        required=True,
        help='Comma-separated list of tables to extract'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='./config/salesforce_config.json',
        help='Path to Salesforce configuration file'
    )

    args = parser.parse_args()

    tables = [t.strip() for t in args.tables.split(',')]

    extractor = SalesforceBronzeExtractor(args.config)
    metrics = extractor.extract_tables(tables)

    print(f"\n✅ Extraction Complete!")
    print(f"Total records extracted: {metrics['total_records']}")
    print(f"Files created: {len(metrics['files_created'])}")
    for table_metric in metrics['tables_processed']:
        if 'records' in table_metric:
            print(f"  - {table_metric['table']}: {table_metric['records']} records")


if __name__ == '__main__':
    main()
