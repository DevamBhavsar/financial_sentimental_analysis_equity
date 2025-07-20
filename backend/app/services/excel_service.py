import pandas as pd
from strawberry.file_uploads import Upload
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ExcelService:
    @staticmethod
    async def read_excel(upload: Upload, filename: str) -> List[Dict[str, Any]]:
        """
        Read Excel file from Strawberry Upload object
        """
        try:
            logger.info(f"Processing file: {filename}")
            
            # Read file content
            file_content = await upload.read()
            logger.info(f"File size: {len(file_content)} bytes")
            
            # Reset file pointer for potential re-reading
            await upload.seek(0)
            
            # Create BytesIO object for pandas
            file_buffer = io.BytesIO(file_content)
            
            # Determine file type and read accordingly
            if filename.lower().endswith('.xlsx'):
                # Read Excel file - skip first 14 rows, then use row 15 as header (which becomes header=0 after skipping)
                df = pd.read_excel(file_buffer, engine='openpyxl', skiprows=14, header=0)
                logger.info("Reading Excel file: skipping first 14 rows, using row 15 as headers")
            elif filename.lower().endswith('.csv'):
                # Read CSV file
                df = pd.read_csv(file_buffer)
            else:
                raise ValueError("Unsupported file format. Only .xlsx and .csv are supported.")
            
            logger.info(f"Successfully read file with {len(df)} rows and {len(df.columns)} columns")
            logger.info(f"Original columns: {list(df.columns)}")
            
            # Clean column names (remove whitespace, convert to lowercase, replace spaces with underscores)
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('/', '_').str.replace('(', '').str.replace(')', '').str.replace('%', 'pct')
            
            logger.info(f"Cleaned columns: {list(df.columns)}")
            
            # Map actual column names to expected names based on the file structure
            column_mapping = {
                # Direct mappings from the Excel file structure (after cleaning)
                'client_id': 'client_id',
                'company_name': 'company_name',
                'isin': 'isin',
                'marketcap': 'market_cap',
                'sector': 'sector',
                'total_quantity': 'total_quantity',
                # 'free_quantity': 'free_quantity',
                # 'unsettled_quantity': 'unsettled_quantity',
                # 'margin_pledged_quantity': 'margin_pledged_quantity',
                # 'paylatermtf_quantity': 'paylater_mtf_quantity',  # Fixed: this was missing in the original mapping
                # 'unpaidcusa_qty': 'unpaid_cusa_qty',
                # 'blocked_qty': 'blocked_qty',
                'avg_trading_price': 'avg_trading_price',
                'ltp': 'ltp',
                'invested_value': 'invested_value',
                'market_value': 'market_value',
                'overall_gain_loss': 'overall_gain_loss',
                # 'ltcg_quantity': 'ltcg_quantity',
                # 'ltcg_value': 'ltcg_value',
                'stcg_quantity': 'stcg_quantity',
                'stcg_value': 'stcg_value',
                
                # Handle variations that might occur after cleaning
                'gain_loss': 'overall_gain_loss'
            }
            
            # Rename columns based on mapping (only if they exist)
            for old_name, new_name in column_mapping.items():
                if old_name in df.columns:
                    df.rename(columns={old_name: new_name}, inplace=True)
            
            logger.info(f"Final columns after mapping: {list(df.columns)}")
            
            # Validate required columns
            required_columns = [
                'company_name', 'isin', 'sector', 'total_quantity',
                'avg_trading_price', 'ltp', 'invested_value', 
                'market_value', 'overall_gain_loss'
            ]
            
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                logger.error(f"Missing required columns: {missing_columns}")
                logger.error(f"Available columns: {list(df.columns)}")
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Clean and validate data
            # Remove rows where Client ID is 'Total' (summary rows)
            if 'client_id' in df.columns:
                df = df[df['client_id'] != 'Total']
                df = df[df['client_id'].notna()]  # Remove NaN client IDs
            
            # Remove rows without essential data
            df = df.dropna(subset=['company_name', 'isin'])
            df = df[df['company_name'].astype(str).str.strip() != '']
            
            # Handle ISIN codes (they appear to be truncated to 'INE' in this file)
            logger.info("Note: ISIN codes in this file appear to be truncated to 'INE' prefix")
            
            # Convert numeric columns
            numeric_columns = [
                'total_quantity',  'avg_trading_price', 
                'ltp', 'invested_value', 'market_value', 'overall_gain_loss',              
                'stcg_quantity', 'stcg_value'
            ]
            
            for col in numeric_columns:
                if col in df.columns:
                    # Handle string numbers with commas
                    if df[col].dtype == 'object':
                        df[col] = df[col].astype(str).str.replace(',', '')
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
            # Add some validation
            valid_rows = df[
                (df['total_quantity'] > 0) & 
                (df['company_name'].str.len() > 0) &
                (df['invested_value'] > 0)
            ]
            
            if len(valid_rows) != len(df):
                logger.warning(f"Filtered out {len(df) - len(valid_rows)} invalid rows")
                df = valid_rows
            
            # Convert to list of dictionaries
            holdings_data = df.to_dict('records')
            
            logger.info(f"Successfully processed {len(holdings_data)} holdings")
            
            # Log a sample record for debugging
            if holdings_data:
                logger.info(f"Sample record: {holdings_data[0]}")
            
            return holdings_data
            
        except Exception as e:
            logger.error(f"Error processing Excel file: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise e