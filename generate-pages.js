require('dotenv').config();
const Airtable = require('airtable');
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// Configure Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_TABLE_NAME;

// Create events directory if it doesn't exist
const eventsDir = path.join(process.cwd(), 'events');
fs.ensureDirSync(eventsDir);

// Read the HTML template
const templatePath = path.join(process.cwd(), 'template.html');
const templateSource = fs.readFileSync(templatePath, 'utf-8');
const template = Handlebars.compile(templateSource);

// Track processed records to avoid duplicates
const processedRecordsFile = path.join(process.cwd(), 'processed-records.json');
let processedRecords = {};
if (fs.existsSync(processedRecordsFile)) {
  processedRecords = fs.readJsonSync(processedRecordsFile);
}

async function generatePages() {
  console.log('Fetching records from Airtable...');
  
  try {
    const records = await base(tableName).select().all();
    console.log(`Found ${records.length} records in Airtable.`);
    
    let newPagesCount = 0;
    
    for (const record of records) {
      const recordId = record.id;
      
      // Skip if already processed
      if (processedRecords[recordId]) {
        continue;
      }
      
      const fields = record.fields;
      console.log(`Processing record: ${fields.title || recordId}`);
      
      // Generate a slug for the file name
      const slug = fields.title 
        ? fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : recordId;
      //convert ISO-8601 time to human friendly time.
    
      var startDate = function(){
        var isodate = new Date(fields.date_start);
        var localedateformat = isodate.toLocaleDateString('en-US');
        return lolocaledateformat;
      }
      var endDate = function(){
        var isodate = new Date(fields.date_end);
        var localedateformat = isodate.toLocaleDateString('en-US');
        return lolocaledateformat;
      }
      
      // Create data object for template
      const eventData = {
        title: fields.title || '',
        date_start: startDate || '',
        date_end: endDate || '',
        time: fields.time || '',
        location: fields.location || '',
        description: fields.description || '',
        timezone: fields.timezone || 'PDT / GMT-07:00',
        image: fields.image || '',
        ogImage: fields.ogImage || '',
        google: fields.google || '',
        apple: fields.apple || '',
        outlook: fields.outlook || ''
      };
      
      // Generate HTML content from template
      const htmlContent = template(eventData);
      
      // Write HTML file
      const filePath = path.join(eventsDir, `${slug}.html`);
      fs.writeFileSync(filePath, htmlContent);
      
      // Mark as processed
      processedRecords[recordId] = {
        slug: slug,
        title: fields.title,
        processedAt: new Date().toISOString()
      };
      
      newPagesCount++;
    }
    
    // Save processed records list
    fs.writeJsonSync(processedRecordsFile, processedRecords);
    
    console.log(`Generated ${newPagesCount} new pages.`);
    
    // Generate index.html with links to all events
    generateIndexPage();
    
  } catch (error) {
    console.error('Error generating pages:', error);
  }
}

function generateIndexPage() {
  console.log('Generating index page...');
  
  const events = Object.values(processedRecords).map(record => ({
    title: record.title || 'Untitled Event',
    url: `events/${record.slug}.html`,
    processedAt: record.processedAt
  })).sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
  
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Events</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .event-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .event-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .event-title {
            margin-top: 0;
            color: #333;
        }
        .event-link {
            display: inline-block;
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #4285F4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        h1 {
            color: #4285F4;
        }
    </style>
</head>
<body>
    <h1>Calendar Events</h1>
    <p>Below are all the events created from Airtable:</p>
    
    <div class="event-list">
        ${events.map(event => `
        <div class="event-card">
            <h3 class="event-title">${event.title}</h3>
            <p>Created: ${new Date(event.processedAt).toLocaleDateString()}</p>
            <a href="${event.url}" class="event-link">View Event</a>
        </div>
        `).join('')}
    </div>
    
    <div class="powered-by" style="margin-top: 50px; text-align: center;">
        Powered by
        <div class="addcal-logo">
            <span style="font-size: 24px; color: #4285F4; margin-right: 5px;">&#x1F4C5;</span>
            Txtnvite
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(process.cwd(), 'index.html'), indexHtml);
  console.log('Index page generated.');
}

// Run the main function
generatePages();
