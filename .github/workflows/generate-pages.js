name: Generate Pages from Airtable

on:
  schedule:
    - cron: '0 */6 * * *'  # Run every 6 hours
  workflow_dispatch:  # Allow manual triggering

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm init -y
          npm install airtable fs-extra handlebars dotenv
          
      - name: Create .env file
        run: |
          echo "AIRTABLE_API_KEY=${{ secrets.AIRTABLE_API_KEY }}" > .env
          echo "AIRTABLE_BASE_ID=${{ secrets.AIRTABLE_BASE_ID }}" >> .env
          echo "AIRTABLE_TABLE_NAME=${{ secrets.AIRTABLE_TABLE_NAME }}" >> .env
          
      - name: Generate pages from Airtable data
        run: node generate-pages.js
        
      - name: Commit and push if changes
        run: |
          git config --global user.name 'GitHub Actions Bot'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add -A
          git diff --quiet && git diff --staged --quiet || (git commit -m "Auto-generate pages from Airtable [skip ci]" && git push)
