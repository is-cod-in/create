# DNS Records Submission Guidelines for is-cod.in

Welcome to the DNS Records repository for `is-cod.in`! To request a DNS record (A, CNAME, MX, TXT), please follow the guidelines below:

## How to Add DNS Records

1. **Create a New File**: 
   - Each DNS record should be added in its own file.
   - Name the file using the format `subdomain.txt`, for example, `subdomain1.txt`.

2. **File Content Format**:
   - The content of the file should follow this format:
     ```
     TYPE SUBDOMAIN VALUE
     ```
   - **TYPE**: The type of DNS record (A, CNAME, MX, TXT).
   - **SUBDOMAIN**: The subdomain you want to create (e.g., `subdomain1` for `subdomain1.is-cod.in`).
   - **VALUE**: The IP address, target domain, or other necessary value depending on the record type.

   ### Example Records
   - For an A record:
     ```
     A subdomain1 192.0.2.1
     ```
   - For a CNAME record:
     ```
     CNAME subdomain2 target.com
     ```
   - For an MX record:
     ```
     MX subdomain3 mailserver.com
     ```
   - For a TXT record:
     ```
     TXT subdomain4 "Your text record"
     ```

3. **Submit a Pull Request**:
   - After adding your file, create a pull request with a description of the changes.
   - Make sure to only add subdomains; requests for the main domain `is-cod.in` will be ignored.

## Important Notes
- Only subdomains of `is-cod.in` can be added. Requests for the main domain will not be accepted.
- Ensure that your DNS record is valid and necessary.

Thank you for your contribution!
