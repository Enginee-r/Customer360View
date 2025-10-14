"""
Silver Layer Transformation Script
Transforms Bronze layer data into cleansed, standardized Silver layer
"""

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import pyarrow.parquet as pq
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SilverLayerTransformer:
    """Transform Bronze layer to Silver layer using JSON configuration"""

    # Exchange rates (in real implementation, fetch from API)
    EXCHANGE_RATES = {
        'USD': 1.0,
        'ZAR': 0.053,  # South African Rand
        'KES': 0.0078,  # Kenyan Shilling
        'NGN': 0.0013,  # Nigerian Naira
        'EUR': 1.09,
        'GBP': 1.27
    }

    REGION_MAPPING = {
        'South Africa': 'South Africa',
        'ZA': 'South Africa',
        'Kenya': 'Kenya',
        'KE': 'Kenya',
        'Nigeria': 'Nigeria',
        'NG': 'Nigeria',
        'USA': 'North America',
        'United States': 'North America',
        'UK': 'Europe',
        'United Kingdom': 'Europe'
    }

    def __init__(self, config_path: str, mapping_path: str):
        """Initialize transformer with configuration"""
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        with open(mapping_path, 'r') as f:
            self.mapping = json.load(f)

        self.bronze_path = Path(self.config.get('bronze_path', './data/bronze'))
        self.silver_path = Path(self.config.get('silver_path', './data/silver'))
        self.silver_path.mkdir(parents=True, exist_ok=True)

        logger.info("Silver layer transformer initialized")

    def apply_transformation(self, value: Any, transformation: str, column_name: str = '') -> Any:
        """Apply specified transformation to value"""
        if pd.isna(value):
            if transformation == 'null_to_zero':
                return 0
            return None

        try:
            if transformation == 'trim_upper':
                return str(value).strip().upper()
            elif transformation == 'trim':
                return str(value).strip()
            elif transformation == 'trim_lower':
                return str(value).strip().lower()
            elif transformation == 'standardize_account_type':
                type_map = {
                    'CUSTOMER': 'Enterprise',
                    'PARTNER': 'Wholesale',
                    'PROSPECT': 'SMB'
                }
                return type_map.get(str(value).upper(), str(value))
            elif transformation == 'map_country_to_region':
                return self.REGION_MAPPING.get(value, value)
            elif transformation == 'convert_to_usd':
                # Assume value is in local currency, default to USD if unknown
                return float(value) if value else 0.0
            elif transformation == 'parse_date':
                return pd.to_datetime(value).date()
            elif transformation == 'null_to_zero':
                return 0 if pd.isna(value) else value
            elif transformation == 'divide_by_100':
                return float(value) / 100.0 if value else 0.0
            elif transformation == 'to_boolean':
                return bool(value)
            elif transformation == 'standardize_stage':
                stage_map = {
                    'PROSPECTING': 'Prospecting',
                    'QUALIFICATION': 'Qualification',
                    'PROPOSAL': 'Proposal',
                    'NEGOTIATION': 'Negotiation',
                    'CLOSED WON': 'Closed Won',
                    'CLOSED LOST': 'Closed Lost'
                }
                return stage_map.get(str(value).upper(), str(value))
            elif transformation == 'standardize_phone':
                # Remove non-numeric characters
                phone = re.sub(r'[^0-9+]', '', str(value))
                return phone
            else:
                return value
        except Exception as e:
            logger.warning(f"Transformation '{transformation}' failed for value '{value}': {e}")
            return value

    def transform_table(self, table_name: str, bronze_df: pd.DataFrame) -> pd.DataFrame:
        """Transform a table from bronze to silver layer"""
        logger.info(f"Transforming {table_name}...")

        table_mapping = self.mapping.get(table_name)
        if not table_mapping:
            raise ValueError(f"No mapping found for table: {table_name}")

        # Create new dataframe for silver layer
        silver_data = {}

        # Transform mapped columns
        for col_config in table_mapping['columns']:
            source_col = col_config['source_column']
            target_col = col_config['target_column']
            transformation = col_config['transformation']

            if source_col not in bronze_df.columns:
                logger.warning(f"Source column '{source_col}' not found in bronze data")
                continue

            # Apply transformation
            silver_data[target_col] = bronze_df[source_col].apply(
                lambda x: self.apply_transformation(x, transformation, target_col)
            )

        silver_df = pd.DataFrame(silver_data)

        # Add metadata
        silver_df['_processed_at'] = datetime.utcnow()
        silver_df['_layer'] = 'silver'

        logger.info(f"Transformed {len(silver_df)} records for {table_name}")
        return silver_df

    def load_latest_bronze(self, table_name: str) -> pd.DataFrame:
        """Load the most recent bronze file for a table"""
        pattern = f"bronze_{table_name}_*.parquet"
        files = list(self.bronze_path.glob(pattern))

        if not files:
            raise FileNotFoundError(f"No bronze files found for {table_name}")

        # Get most recent file
        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading bronze file: {latest_file}")

        return pd.read_parquet(latest_file)

    def save_silver(self, df: pd.DataFrame, table_name: str) -> str:
        """Save transformed data to silver layer"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"silver_{table_name}_{timestamp}.parquet"
        filepath = self.silver_path / filename

        df.to_parquet(filepath, compression='snappy', index=False)

        logger.info(f"Saved silver layer: {filepath}")
        return str(filepath)

    def transform_all_tables(self, tables: List[str]) -> Dict[str, Any]:
        """Transform multiple tables from bronze to silver"""
        metrics = {
            'start_time': datetime.utcnow().isoformat(),
            'tables_processed': [],
            'total_records': 0
        }

        for table in tables:
            try:
                # Load bronze data
                bronze_df = self.load_latest_bronze(table)

                # Transform to silver
                silver_df = self.transform_table(table, bronze_df)

                # Save silver data
                filepath = self.save_silver(silver_df, table)

                metrics['tables_processed'].append({
                    'table': table,
                    'records': len(silver_df),
                    'file': filepath
                })
                metrics['total_records'] += len(silver_df)

            except Exception as e:
                logger.error(f"Error transforming {table}: {str(e)}")
                metrics['tables_processed'].append({
                    'table': table,
                    'error': str(e)
                })

        metrics['end_time'] = datetime.utcnow().isoformat()

        # Save metrics
        metrics_file = self.silver_path / f"transformation_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)

        logger.info(f"Transformation complete. Metrics saved to: {metrics_file}")
        return metrics


def main():
    parser = argparse.ArgumentParser(description='Transform Bronze to Silver layer')
    parser.add_argument(
        '--tables',
        type=str,
        default='account,opportunity,opportunity_line_item,contact',
        help='Comma-separated list of tables to transform'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='./config/salesforce_config.json',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--mapping',
        type=str,
        default='./config/bronze_to_silver_mapping.json',
        help='Path to transformation mapping file'
    )

    args = parser.parse_args()

    tables = [t.strip() for t in args.tables.split(',')]

    transformer = SilverLayerTransformer(args.config, args.mapping)
    metrics = transformer.transform_all_tables(tables)

    print(f"\n✅ Transformation Complete!")
    print(f"Total records transformed: {metrics['total_records']}")
    for table_metric in metrics['tables_processed']:
        if 'records' in table_metric:
            print(f"  - {table_metric['table']}: {table_metric['records']} records")


if __name__ == '__main__':
    main()
