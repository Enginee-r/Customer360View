"""
Cross-Regional Account Linking Script
Links the same customer across different regions using fuzzy matching
"""

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import uuid

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AccountLinker:
    """Link accounts across regions to create master account view"""

    SIMILARITY_THRESHOLD = 0.85  # 85% similarity for fuzzy matching

    def __init__(self, config_path: str):
        """Initialize account linker"""
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.silver_path = Path(self.config.get('silver_path', './data/silver'))
        self.gold_path = Path(self.config.get('gold_path', './data/gold'))
        self.gold_path.mkdir(parents=True, exist_ok=True)

        # Load accounts
        self.accounts = self.load_latest_silver('account')

        # Load manual linkages if they exist
        self.manual_linkages = self.load_manual_linkages()

        logger.info(f"Account linker initialized with {len(self.accounts)} accounts")

    def load_latest_silver(self, table_name: str) -> pd.DataFrame:
        """Load the most recent silver file for a table"""
        pattern = f"silver_{table_name}_*.parquet"
        files = list(self.silver_path.glob(pattern))

        if not files:
            raise FileNotFoundError(f"No silver files found for {table_name}")

        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Loading silver file: {latest_file}")
        return pd.read_parquet(latest_file)

    def load_manual_linkages(self) -> Dict[str, str]:
        """Load manual account linkages from file"""
        manual_file = self.gold_path / 'manual_account_linkages.json'

        if manual_file.exists():
            with open(manual_file, 'r') as f:
                return json.load(f)
        return {}

    def normalize_company_name(self, name: str) -> str:
        """Normalize company name for matching"""
        if pd.isna(name):
            return ''

        # Convert to lowercase
        normalized = str(name).lower().strip()

        # Remove common suffixes and prefixes
        suffixes = [
            'inc', 'incorporated', 'corp', 'corporation', 'ltd', 'limited',
            'llc', 'pty', 'gmbh', 'sa', 'nv', 'bv', 'ag', 'plc'
        ]

        for suffix in suffixes:
            # Remove suffix with various separators
            for sep in [' ', '.', ',', '-']:
                pattern = f"{sep}{suffix}"
                if normalized.endswith(pattern):
                    normalized = normalized[:-len(pattern)]

        # Remove special characters except spaces
        normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())

        # Remove extra whitespace
        normalized = ' '.join(normalized.split())

        return normalized

    def calculate_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity score between two company names"""
        if not name1 or not name2:
            return 0.0

        # Normalize names
        norm1 = self.normalize_company_name(name1)
        norm2 = self.normalize_company_name(name2)

        if norm1 == norm2:
            return 1.0

        # Use SequenceMatcher for fuzzy matching
        return SequenceMatcher(None, norm1, norm2).ratio()

    def check_parent_match(self, account1: pd.Series, account2: pd.Series) -> bool:
        """Check if accounts share the same parent"""
        if 'parent_account_id' in account1.index and 'parent_account_id' in account2.index:
            parent1 = account1['parent_account_id']
            parent2 = account2['parent_account_id']

            if pd.notna(parent1) and pd.notna(parent2) and parent1 == parent2:
                return True

        return False

    def check_contact_overlap(self, account1_id: str, account2_id: str, contacts: pd.DataFrame) -> bool:
        """Check if accounts share contacts (emails/phones)"""
        if contacts.empty:
            return False

        contacts1 = contacts[contacts['account_id'] == account1_id]
        contacts2 = contacts[contacts['account_id'] == account2_id]

        # Check email overlap
        emails1 = set(contacts1['email'].dropna())
        emails2 = set(contacts2['email'].dropna())

        if emails1 & emails2:  # Intersection
            return True

        # Check phone overlap
        if 'phone' in contacts.columns:
            phones1 = set(contacts1['phone'].dropna())
            phones2 = set(contacts2['phone'].dropna())

            if phones1 & phones2:
                return True

        return False

    def find_account_matches(self) -> List[Dict[str, Any]]:
        """Find matching accounts across regions"""
        logger.info("Finding account matches...")

        matches = []
        processed_pairs = set()

        # Load contacts if available
        try:
            contacts = self.load_latest_silver('contact')
        except:
            contacts = pd.DataFrame()

        # Compare each account with every other account
        for idx1, account1 in self.accounts.iterrows():
            for idx2, account2 in self.accounts.iterrows():
                # Skip same account or already processed pairs
                if idx1 >= idx2:
                    continue

                pair_key = tuple(sorted([account1['account_id'], account2['account_id']]))
                if pair_key in processed_pairs:
                    continue

                processed_pairs.add(pair_key)

                # Skip if same region (we want cross-regional matches)
                if account1.get('region') == account2.get('region'):
                    continue

                # Check manual linkages first
                if account1['account_id'] in self.manual_linkages:
                    if self.manual_linkages[account1['account_id']] == account2['account_id']:
                        matches.append({
                            'account_1_id': account1['account_id'],
                            'account_1_name': account1['account_name'],
                            'account_1_region': account1.get('region', 'Unknown'),
                            'account_2_id': account2['account_id'],
                            'account_2_name': account2['account_name'],
                            'account_2_region': account2.get('region', 'Unknown'),
                            'confidence_score': 100.0,
                            'linking_method': 'manual',
                            'matched_at': datetime.utcnow()
                        })
                        continue

                # Calculate name similarity
                similarity = self.calculate_similarity(
                    account1['account_name'],
                    account2['account_name']
                )

                # Check parent match
                has_parent_match = self.check_parent_match(account1, account2)

                # Check contact overlap
                has_contact_overlap = self.check_contact_overlap(
                    account1['account_id'],
                    account2['account_id'],
                    contacts
                )

                # Determine if this is a match
                linking_method = None
                confidence = similarity * 100

                if similarity == 1.0:
                    linking_method = 'exact'
                elif similarity >= self.SIMILARITY_THRESHOLD:
                    linking_method = 'fuzzy'
                    if has_parent_match:
                        confidence = min(100, confidence + 10)
                        linking_method = 'fuzzy_parent'
                    if has_contact_overlap:
                        confidence = min(100, confidence + 10)
                        linking_method = 'fuzzy_contact'
                elif has_parent_match and similarity >= 0.7:
                    linking_method = 'parent'
                    confidence = 90
                elif has_contact_overlap and similarity >= 0.7:
                    linking_method = 'contact'
                    confidence = 85

                if linking_method:
                    matches.append({
                        'account_1_id': account1['account_id'],
                        'account_1_name': account1['account_name'],
                        'account_1_region': account1.get('region', 'Unknown'),
                        'account_2_id': account2['account_id'],
                        'account_2_name': account2['account_name'],
                        'account_2_region': account2.get('region', 'Unknown'),
                        'confidence_score': round(confidence, 2),
                        'linking_method': linking_method,
                        'matched_at': datetime.utcnow()
                    })

        logger.info(f"Found {len(matches)} account matches")
        return matches

    def create_master_accounts(self, matches: List[Dict[str, Any]]) -> pd.DataFrame:
        """Create master account records from matches"""
        logger.info("Creating master accounts...")

        # Build graph of linked accounts
        from collections import defaultdict

        account_groups = defaultdict(set)
        account_to_group = {}

        # Group linked accounts
        for match in matches:
            acc1 = match['account_1_id']
            acc2 = match['account_2_id']

            if acc1 in account_to_group:
                group_id = account_to_group[acc1]
            elif acc2 in account_to_group:
                group_id = account_to_group[acc2]
            else:
                group_id = str(uuid.uuid4())

            account_groups[group_id].add(acc1)
            account_groups[group_id].add(acc2)
            account_to_group[acc1] = group_id
            account_to_group[acc2] = group_id

        # Create master account records
        master_accounts = []

        for group_id, account_ids in account_groups.items():
            # Get all accounts in this group
            group_accounts = self.accounts[self.accounts['account_id'].isin(account_ids)]

            # Aggregate metrics across regions
            total_revenue = group_accounts['annual_revenue_usd'].sum()
            regions = list(group_accounts['region'].unique())

            # Use the name from the largest account
            primary_account = group_accounts.loc[group_accounts['annual_revenue_usd'].idxmax()]

            master_accounts.append({
                'master_account_id': group_id,
                'master_account_name': primary_account['account_name'],
                'regional_account_ids': list(account_ids),
                'regions': regions,
                'total_revenue_usd': total_revenue,
                'account_count': len(account_ids),
                'primary_region': primary_account.get('region', 'Unknown'),
                'created_at': datetime.utcnow()
            })

        return pd.DataFrame(master_accounts)

    def link_accounts(self) -> Dict[str, Any]:
        """Execute account linking process"""
        logger.info("Starting account linking process...")

        results = {}

        # Find matches
        matches = self.find_account_matches()
        if matches:
            matches_df = pd.DataFrame(matches)
            filepath = self.save_gold_table(matches_df, 'account_linkages')
            results['account_linkages'] = {
                'records': len(matches_df),
                'file': filepath
            }

            # Create master accounts
            master_accounts = self.create_master_accounts(matches)
            filepath = self.save_gold_table(master_accounts, 'master_accounts')
            results['master_accounts'] = {
                'records': len(master_accounts),
                'file': filepath
            }

        return results

    def save_gold_table(self, df: pd.DataFrame, table_name: str) -> str:
        """Save gold layer table"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"gold_{table_name}_{timestamp}.parquet"
        filepath = self.gold_path / filename

        df.to_parquet(filepath, compression='snappy', index=False)

        logger.info(f"Saved gold table: {filepath}")
        return str(filepath)


def main():
    parser = argparse.ArgumentParser(description='Link accounts across regions')
    parser.add_argument(
        '--config',
        type=str,
        default='./config/salesforce_config.json',
        help='Path to configuration file'
    )

    args = parser.parse_args()

    linker = AccountLinker(args.config)
    results = linker.link_accounts()

    print(f"\n✅ Account Linking Complete!")
    for table_name, info in results.items():
        print(f"  - {table_name}: {info['records']} records")


if __name__ == '__main__':
    main()
