"""
Multi-Currency Normalization Script
Converts all revenue fields to USD for consistent reporting
"""

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
import pandas as pd
import requests

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CurrencyNormalizer:
    """Normalize all currency fields to USD"""

    # Default exchange rates (fallback if API fails)
    DEFAULT_RATES = {
        'USD': 1.0,
        'ZAR': 0.053,   # South African Rand
        'KES': 0.0078,  # Kenyan Shilling
        'NGN': 0.0013,  # Nigerian Naira
        'EUR': 1.09,    # Euro
        'GBP': 1.27,    # British Pound
        'AUD': 0.65,    # Australian Dollar
        'CAD': 0.74     # Canadian Dollar
    }

    def __init__(self, config_path: str):
        """Initialize with configuration"""
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.exchange_rates = self.fetch_exchange_rates()
        self.silver_path = Path(self.config.get('silver_path', './data/silver'))
        self.output_path = self.silver_path  # Update silver files in place

        logger.info(f"Currency normalizer initialized with {len(self.exchange_rates)} exchange rates")

    def fetch_exchange_rates(self) -> Dict[str, float]:
        """Fetch current exchange rates from API or use defaults"""
        try:
            # In production, use a real API like exchangerate-api.com or fixer.io
            # response = requests.get('https://api.exchangerate-api.com/v4/latest/USD')
            # rates = response.json()['rates']
            # # Invert rates since API gives USD to other currencies
            # return {currency: 1/rate for currency, rate in rates.items()}

            logger.info("Using default exchange rates")
            return self.DEFAULT_RATES.copy()

        except Exception as e:
            logger.warning(f"Failed to fetch exchange rates: {e}. Using defaults.")
            return self.DEFAULT_RATES.copy()

    def get_historical_rate(self, currency: str, date: datetime) -> float:
        """Get historical exchange rate for a specific date"""
        # In production, fetch historical rates from API
        # For now, use current rates
        return self.exchange_rates.get(currency, 1.0)

    def detect_currency(self, row: pd.Series, amount_field: str) -> str:
        """Detect currency for a transaction"""
        # Check if there's a currency field
        if 'currency' in row.index and pd.notna(row['currency']):
            return row['currency']

        # Infer from region/country
        if 'region' in row.index:
            region_currency_map = {
                'South Africa': 'ZAR',
                'Kenya': 'KES',
                'Nigeria': 'NGN',
                'Europe': 'EUR',
                'North America': 'USD'
            }
            return region_currency_map.get(row['region'], 'USD')

        # Default to USD
        return 'USD'

    def convert_to_usd(self, amount: float, currency: str, date: datetime = None) -> float:
        """Convert amount from currency to USD"""
        if pd.isna(amount) or amount == 0:
            return 0.0

        if currency == 'USD':
            return amount

        # Get exchange rate
        if date:
            rate = self.get_historical_rate(currency, date)
        else:
            rate = self.exchange_rates.get(currency, 1.0)

        return amount * rate

    def normalize_table(self, table_name: str, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize currency fields in a table"""
        logger.info(f"Normalizing currencies for {table_name}...")

        # Identify currency fields based on table
        currency_fields = []

        if table_name == 'account':
            currency_fields = ['annual_revenue_usd']
        elif table_name == 'opportunity':
            currency_fields = ['deal_value']
        elif table_name == 'opportunity_line_item':
            currency_fields = ['unit_price', 'total_price']

        # Process each row
        for idx, row in df.iterrows():
            # Detect currency
            currency = self.detect_currency(row, currency_fields[0] if currency_fields else '')

            # Store original currency
            df.at[idx, 'original_currency'] = currency

            # Convert all currency fields
            for field in currency_fields:
                if field in df.columns and pd.notna(row[field]):
                    original_amount = row[field]

                    # Get date for historical rate if available
                    date = None
                    if 'close_date' in df.columns:
                        date = pd.to_datetime(row['close_date']) if pd.notna(row['close_date']) else None

                    # Convert to USD
                    usd_amount = self.convert_to_usd(original_amount, currency, date)

                    # Store conversion metadata
                    df.at[idx, f'{field}_original'] = original_amount
                    df.at[idx, field] = usd_amount
                    df.at[idx, f'{field}_exchange_rate'] = self.exchange_rates.get(currency, 1.0)

        # Add metadata
        df['_currency_normalized_at'] = datetime.utcnow()

        logger.info(f"Normalized {len(df)} records for {table_name}")
        return df

    def load_latest_silver(self, table_name: str) -> pd.DataFrame:
        """Load the most recent silver file for a table"""
        pattern = f"silver_{table_name}_*.parquet"
        files = list(self.silver_path.glob(pattern))

        if not files:
            raise FileNotFoundError(f"No silver files found for {table_name}")

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading silver file: {latest_file}")
        return pd.read_parquet(latest_file)

    def save_normalized(self, df: pd.DataFrame, table_name: str) -> str:
        """Save normalized data"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"silver_{table_name}_normalized_{timestamp}.parquet"
        filepath = self.output_path / filename

        df.to_parquet(filepath, compression='snappy', index=False)

        logger.info(f"Saved normalized data: {filepath}")
        return str(filepath)

    def normalize_all_tables(self, tables: list) -> Dict[str, Any]:
        """Normalize currency for all specified tables"""
        metrics = {
            'start_time': datetime.utcnow().isoformat(),
            'exchange_rates_used': self.exchange_rates,
            'tables_processed': []
        }

        for table in tables:
            try:
                df = self.load_latest_silver(table)
                normalized_df = self.normalize_table(table, df)
                filepath = self.save_normalized(normalized_df, table)

                metrics['tables_processed'].append({
                    'table': table,
                    'records': len(normalized_df),
                    'file': filepath
                })

            except Exception as e:
                logger.error(f"Error normalizing {table}: {str(e)}")
                metrics['tables_processed'].append({
                    'table': table,
                    'error': str(e)
                })

        metrics['end_time'] = datetime.utcnow().isoformat()

        # Save metrics
        metrics_file = self.output_path / f"currency_normalization_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)

        logger.info(f"Normalization complete. Metrics saved to: {metrics_file}")
        return metrics


def main():
    parser = argparse.ArgumentParser(description='Normalize currencies to USD')
    parser.add_argument(
        '--tables',
        type=str,
        default='account,opportunity,opportunity_line_item',
        help='Comma-separated list of tables to normalize'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='./config/salesforce_config.json',
        help='Path to configuration file'
    )

    args = parser.parse_args()

    tables = [t.strip() for t in args.tables.split(',')]

    normalizer = CurrencyNormalizer(args.config)
    metrics = normalizer.normalize_all_tables(tables)

    print(f"\n✅ Currency Normalization Complete!")
    print(f"\nExchange rates used:")
    for currency, rate in metrics['exchange_rates_used'].items():
        print(f"  {currency}: {rate:.6f}")

    print(f"\nTables normalized:")
    for table_metric in metrics['tables_processed']:
        if 'records' in table_metric:
            print(f"  - {table_metric['table']}: {table_metric['records']} records")


if __name__ == '__main__':
    main()
