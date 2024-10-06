const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/zones/bdae6f399c757c2326b0539fe18151a2/dns_records`;

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
    const recordType = parts[0];

    if (recordType === 'MX') {
        return {
            type: recordType,
            subdomain: subdomain,
            value: parts[2],
            priority: parts[1] // MX records include priority as second part
        };
    }

    if (recordType === 'CNAME') {
        return {
            type: recordType,
            subdomain: subdomain,
            value: parts[2],
            proxied: parts[3] === 'proxied' // CNAME record may include proxy status
        };
    }

    return {
        type: recordType,
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
        proxied: record.type === 'CNAME' ? record.proxied : false // Proxy status for CNAME
    };

    if (record.type === 'MX') {
        data.priority = record.priority; // Include priority for MX records
    }

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
