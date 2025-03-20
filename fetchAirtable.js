const fs = require('fs');
const axios = require('axios');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY; // Store in GitHub Secrets
const BASE_ID = 'your_base_id';
const TABLE_NAME = 'your_table_name';
const OUTPUT_DIR = './generated_pages';

// Fetch data from Airtable
async function fetchAirtableData() {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    return response.data.records;
}

// Generate HTML files for each record
async function generatePages() {
    const records = await fetchAirtableData();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    records.forEach(record => {
        const { id, fields } = record;
        const filename = `${OUTPUT_DIR}/${id}.html`;
        const content = `
            <html>
            <head><title>${fields.Title}</title></head>
            <body>
                <h1>${fields.Title}</h1>
                <p>${fields.Description}</p>
            </body>
            </html>
        `;
        fs.writeFileSync(filename, content);
    });

    console.log(`Generated ${records.length} pages.`);
}

generatePages();
