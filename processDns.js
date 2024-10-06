const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records`;

async function processPullRequest() {
    const recordsDir = path.join(__dirname, 'records');
    const files = fs.readdirSync(recordsDir);
    
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const filePath = path.join(recordsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
            
            const subdomain = path.basename(file, '.txt');
            for (const line of content) {
                const dnsRecord = parseDNSRecord(line, subdomain);
                if (isValidDNSRecord(dnsRecord)) {
                    await addDNSRecord(dnsRecord);
                } else {
                    console.error(`Invalid DNS record in ${file}: ${line}`);
                }
            }
        }
    }
}

function parseDNSRecord(content, subdomain) {
    const parts = content.split(' ');
    return {
        type: parts[0],
        subdomain: subdomain,
        value: parts.slice(2).join(' ')
    };
}

function isValidDNSRecord(record) {
    const validTypes = ['A', 'CNAME', 'MX', 'TXT'];
    return validTypes.includes(record.type) && record.subdomain !== 'is-cod.in';
}

async function addDNSRecord(record) {
    const data = {
        type: record.type,
        name: `${record.subdomain}.is-cod.in`,
        content: record.value,
        ttl: 1,
        proxied: false
    };

    try {
        const response = await axios.post(CLOUDFLARE_API_URL, data, {
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Added DNS record: ${JSON.stringify(response.data)}`);
    } catch (error) {
        console.error(`Error adding DNS record: ${error.response ? error.response.data : error.message}`);
    }
}

processPullRequest();
