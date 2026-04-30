require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const config = await prisma.rallyConfig.findFirst();
    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = { 'zsessionid': config.apiKey, 'Accept': 'application/json' };
    
    // Search for a test folder by name
    const folderUrl = `${baseUrl}/slm/webservice/v2.0/testfolder?query=(Name = "Regression")&fetch=Name,FormattedID`;
    const res = await axios.get(folderUrl, { headers });
    
    console.log('Results:', res.data.QueryResult.Results.map(r => ({ name: r.Name, ref: r._ref })));
  } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
check();
