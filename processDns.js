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

    if (parts.length < 3) {
        console.error(`Insufficient parts for DNS record: ${content}`);
        return null;
    }

    const recordType = parts[0].toUpperCase();
    const record = { type: recordType, subdomain };

    if (recordType === 'MX' && parts.length === 4) {
        record.value = parts[2];
        record.priority = parseInt(parts[1], 10); // Priority should be a number
    } else if (recordType === 'CNAME' && parts.length >= 3) {
        record.value = parts[2];
        record.proxied = parts[3] === 'proxied'; // Boolean for proxy status
    } else if (['A', 'TXT'].includes(recordType) && parts.length >= 3) {
        record.value = parts.slice(2).join(' ');
    } else {
        console.error(`Invalid DNS record format: ${content}`);
        return null;
    }

    return record;
}

function isValidDNSRecord(record) {
    const validTypes = ['A', 'CNAME', 'MX', 'TXT'];
    return record && validTypes.includes(record.type) && record.subdomain !== 'is-cod.in';
}

async function addDNSRecord(record) {
    const data = {
        type: record.type,
        name: `${record.subdomain}.is-cod.in`,
        content: record.value,
        ttl: 1,
        proxied: record.type === 'CNAME' ? record.proxied : false,
    };

    if (record.type === 'MX') {
        data.priority = record.priority; // Include priority for MX records
    }

    console.log(`Attempting to add DNS record: ${JSON.stringify(data)}`);

    try {
        const response = await axios.post(CLOUDFLARE_API_URL, data, {
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.data.success) {
            console.log(`Added DNS record: ${JSON.stringify(response.data.result)}`);
        } else {
            console.error(`Failed to add DNS record: ${JSON.stringify(response.data.errors)}`);
        }
    } catch (error) {
        console.error(`Error adding DNS record: ${error.response ? error.response.data : error.message}`);
    }
}

processPullRequest();
