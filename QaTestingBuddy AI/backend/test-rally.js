require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const config = await prisma.rallyConfig.findFirst();
    if (!config) {
      console.log('No config found');
      return;
    }
    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = {
      'zsessionid': config.apiKey,
      'Accept': 'application/json',
    };
    
    // Fetch TypeDefinition for TestCase
    const typeUrl = `${baseUrl}/slm/webservice/v2.0/typedefinition?query=(ElementName = "TestCase")&fetch=Attributes,Name,ElementName,Type,AllowedValues`;
    console.log('Fetching', typeUrl);
    const res = await axios.get(typeUrl, { headers });
    const tcType = res.data.QueryResult.Results[0];
    
    if (tcType) {
      const attributesUrl = tcType.Attributes._ref;
      const attrRes = await axios.get(`${attributesUrl}?pagesize=200`, { headers });
      const attrs = attrRes.data.QueryResult.Results;
      const automateAttr = attrs.find(a => a.ElementName === 'Automate' || a.Name === 'Automate' || a.ElementName === 'c_Automate');
      console.log('Automate Attribute:', automateAttr);
      
      if (automateAttr && automateAttr.AllowedValues && automateAttr.AllowedValues._ref) {
        const allowedRes = await axios.get(automateAttr.AllowedValues._ref, { headers });
        console.log('Allowed values:', allowedRes.data.QueryResult.Results.map(r => r.StringValue));
      }
    } else {
      console.log('TestCase type not found');
    }
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();
