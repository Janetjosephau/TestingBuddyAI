require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const config = await prisma.rallyConfig.findFirst();
    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = { 'zsessionid': config.apiKey, 'Accept': 'application/json' };
    
    const typeUrl = `${baseUrl}/slm/webservice/v2.0/typedefinition?query=(ElementName = "TestCase")&fetch=Attributes,Name,ElementName,Type,AllowedValues`;
    const res = await axios.get(typeUrl, { headers });
    const tcType = res.data.QueryResult.Results[0];
    
    const attrRes = await axios.get(`${tcType.Attributes._ref}?pagesize=200`, { headers });
    const attrs = attrRes.data.QueryResult.Results;
    const testFolderAttr = attrs.find(a => a.ElementName === 'TestFolder' || a.Name === 'Test Folder');
    if (testFolderAttr) {
       console.log('TestFolder Type:', testFolderAttr.AttributeType);
       console.log('Real Type:', testFolderAttr.RealAttributeType);
    } else {
       console.log('TestFolder attribute not found');
    }
  } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
check();
