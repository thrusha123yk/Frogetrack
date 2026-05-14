import XLSX from 'xlsx';

const filePath = 'c:\\Users\\HP\\Downloads\\Data Engineering and AI - Actual Program.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('--- FIRST 5 ROWS ---');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
} catch (err) {
  console.error('Error:', err);
}
