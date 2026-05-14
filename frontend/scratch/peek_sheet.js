import XLSX from 'xlsx';
import path from 'path';

const filePath = 'c:\\Users\\HP\\Downloads\\Data Engineering and AI - Actual Program.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('--- SHEET SAMPLE (First 15 rows) ---');
    data.slice(0, 15).forEach((row, i) => {
        console.log(`Row ${i}: ${row.join(' | ')}`);
    });
} catch (error) {
    console.error('Error reading spreadsheet:', error);
}
