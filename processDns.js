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
    const type = parts[0].toUpperCase();
    let record;

    switch (type) {
        case 'A':
        case 'TXT':
            record = { type, subdomain, value: parts.slice(2).join(' '), proxied: false };
            break;
        case 'CNAME':
            record = { 
                type, 
                subdomain, 
                value: parts[2], 
                proxied: parts[3] === 'proxied' // True if "proxied"
            };
            break;
        case 'MX':
            record = { type, subdomain, value: parts[2], priority: parseInt(parts[1], 10) };
            break;
        default:
            throw new Error(`Unsupported DNS record type: ${type}`);
    }

    return record;
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
        proxied: record.type === 'CNAME' ? record.proxied : false,
    };

    // For MX records, include the priority
    if (record.type === 'MX') {
        data.priority = record.priority;
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
