import * as XLSX from 'xlsx';

interface ExcelValidationResult {
  isValid: boolean;
  errors: string[];
}

interface HoldingRow {
  company_name: string;
  isin: string;
  market_cap: number;
  sector: string;
  total_quantity: number;
  free_quantity: number;
  avg_trading_price: number;
  ltp: number;
  invested_value: number;
  market_value: number;
  overall_gain_loss: number;
}

export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array first to skip header rows
        const jsonArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find the actual header row (look for "Company Name" in row)
        let headerRowIndex = -1;
        for (let i = 0; i < jsonArray.length; i++) {
          const row = jsonArray[i] as any[];
          if (row && row.includes('Company Name')) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          throw new Error('Could not find header row with "Company Name" column');
        }
        
        // Extract headers and data
        const headers = jsonArray[headerRowIndex] as string[];
        const dataRows = jsonArray.slice(headerRowIndex + 1);
        
        // Convert to objects with proper headers
        const json = dataRows
          .filter((row: any) => {
            // Filter out empty rows and total/summary rows
            return row && 
                   Array.isArray(row) && 
                   row.length > 0 && 
                   row[0] && 
                   row[1] && // Must have company name
                   row[0].toString().toLowerCase() !== 'total' && // Exclude total rows
                   row[1].toString().toLowerCase() !== 'total'; // Extra safety check
          })
          .map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              if (header) {
                // Map to expected column names
                let key = header.toLowerCase().trim();
                if (key === 'company name') key = 'company_name';
                else if (key === 'total quantity') key = 'total_quantity';
                else if (key === 'free quantity') key = 'free_quantity';
                else if (key === 'avg trading price') key = 'avg_trading_price';
                else if (key === 'ltp') key = 'ltp';
                else if (key === 'invested value') key = 'invested_value';
                else if (key === 'market value') key = 'market_value';
                else if (key === 'overall gain/loss') key = 'overall_gain_loss';
                else if (key === 'marketcap') key = 'market_cap';
                
                obj[key] = row[index];
              }
            });
            return obj;
          });
        
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelTemplate = (data: any[]): ExcelValidationResult => {
  const requiredColumns = [
    'company_name',
    'isin', 
    'sector',
    'total_quantity',
    'avg_trading_price',
    'ltp',
    'invested_value',
    'market_value',
    'overall_gain_loss'
  ];

  const errors: string[] = [];
  
  // Check if file is empty
  if (!data || data.length === 0) {
    return { isValid: false, errors: ['File is empty'] };
  }

  // Validate column presence
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  requiredColumns.forEach(column => {
    if (!availableColumns.includes(column)) {
      errors.push(`Missing required column: ${column}`);
    }
  });

  // If basic columns are missing, return early
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate data types and values
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check required fields are not empty
    if (!row.company_name || row.company_name.toString().trim() === '') {
      errors.push(`Row ${rowNumber}: Company name is required`);
    }
    
    if (!row.isin || row.isin.toString().trim() === '') {
      errors.push(`Row ${rowNumber}: ISIN is required`);
    }
    
    // Validate numeric fields
    const numericFields = ['total_quantity', 'avg_trading_price', 'ltp', 'invested_value', 'market_value', 'overall_gain_loss'];
    numericFields.forEach(field => {
      const value = row[field];
      if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
        errors.push(`Row ${rowNumber}: ${field} must be a valid number`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
