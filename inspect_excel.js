const XLSX = require('xlsx');
const filePath = 'c:\\Users\\thanh\\Desktop\\Projects\\pgrb-data-transpose\\Product Description Export 2026-04-05 21-47-51.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log('--- Workbook Summary ---');
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Read header row (row 4 usually) and first few data rows
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        console.log(`\nSheet: "${sheetName}"`);
        
        let headerIndex = -1;
        for(let i=0; i<Math.min(raw.length, 10); i++) {
            if (raw[i].some(cell => String(cell).toLowerCase().includes('wayfair listing'))) {
                headerIndex = i;
                console.log(`Found header at row ${i+1}:`, JSON.stringify(raw[i]));
                break;
            }
        }

        if (headerIndex !== -1) {
            console.log('Rows containing STKL1739:');
            for (let i = headerIndex + 1; i < raw.length; i++) {
                const row = raw[i];
                if (row.some(cell => String(cell).includes('STKL1739'))) {
                    console.log(`Row ${i + 1}:`, JSON.stringify(row));
                }
            }
        }
    });

} catch (err) {
    console.error('Error:', err.message);
}
