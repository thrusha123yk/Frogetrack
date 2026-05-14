import XLSX from 'xlsx';
import path from 'path';

const filePath = 'c:\\Users\\HP\\Downloads\\Data Engineering and AI - Actual Program.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheets found:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Analyzing Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Show first 10 rows to see headers and structure
    data.slice(0, 10).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  });
} catch (err) {
  console.error('Error reading file:', err);
}
