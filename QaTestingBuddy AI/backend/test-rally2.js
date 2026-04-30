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
    const autoAttrs = attrs.filter(a => a.ElementName.toLowerCase().includes('auto') || a.Name.toLowerCase().includes('auto'));
    
    for (const a of autoAttrs) {
      console.log('Found:', a.ElementName, '| Name:', a.Name, '| Type:', a.AttributeType);
      if (a.AllowedValues && a.AllowedValues._ref) {
         const allowedRes = await axios.get(a.AllowedValues._ref, { headers });
         console.log('  Allowed:', allowedRes.data.QueryResult.Results.map(r => r.StringValue));
      }
    }
  } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
check();
