import boto3
import json
import urllib.request
import re
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
route53resolver = boto3.client('route53resolver')

HOSTFILE_URL = "https://urlhaus.abuse.ch/downloads/hostfile/"
BUCKET_NAME = "<REPLACE-WITH-YOUR-BUCKET-NAME>"
DOMAIN_LIST_ID = "<REPLACE-WITH-YOUR-DOMAIN-LIST-ID>"
FILE_KEY = "autoupdating-dnsfirewall-domains.txt"

# Compile the pattern once
DOMAIN_PATTERN = re.compile(
    r'^'                           # Start of string
    r'(?!-)'                       # Cannot start with hyphen
    r'(?!.*--)'                    # No consecutive hyphens
    r'(?=.{1,253}$)'              # Total length 1-253 (RFC compliant)
    r'(?:'                         # Non-capturing group for labels
        r'[a-zA-Z0-9]'             # Label must start with alphanumeric
        r'(?:[a-zA-Z0-9-]{0,61}'   # Middle can have hyphens (max 63 total)
        r'[a-zA-Z0-9])?'           # Must end with alphanumeric if >1 char
        r'\.'                      # Followed by dot
    r')+'                          # One or more labels
    r'[a-zA-Z]'                    # TLD starts with letter
    r'(?:[a-zA-Z0-9-]{0,61}'       # TLD middle part
    r'[a-zA-Z0-9])?'               # TLD ends with alphanumeric if >1 char
    r'$'                           # End of string
)

def import_list(s3_obj):
    try:
        res = route53resolver.import_firewall_domains(
            DomainFileUrl=s3_obj,
            FirewallDomainListId=DOMAIN_LIST_ID,
            Operation="REPLACE"
        )
        print(f"Updating the domain list using {s3_obj}")
        return res
    except ClientError as e:
        print(f"Error importing firewall domains: {e}")
        return None

def write_to_s3(domains):
    try:
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=FILE_KEY,
            Body='\n'.join(domains),
            ContentType="text/plain"
        )
        return f"s3://{BUCKET_NAME}/{FILE_KEY}"
    except ClientError as e:
        print(f"Error writing to S3: {e}")
        return None

def delete_from_s3():
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
        print("Deleted the import file")
    except ClientError as e:
        print(f"Error deleting from S3: {e}")

def get_domains():
    print(f"Fetching the list of domains from {HOSTFILE_URL}")
    try:
        with urllib.request.urlopen(HOSTFILE_URL) as response:
            data = response.read().decode('utf-8')
        
        # Use a set for faster membership testing and uniqueness
        filtered_domains = set()
        
        for line in data.splitlines():
            if line.startswith('#') or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 2:
                domain = parts[1].strip()
                if DOMAIN_PATTERN.match(domain):
                    filtered_domains.add(domain)
                    # print(f"Added domain: {domain}")  # Print each added domain
        
        print(f"Fetched {len(filtered_domains)} Domains")
        return list(filtered_domains)  # Convert back to list for consistency
    except urllib.error.URLError as e:
        print(f"Error fetching domains: {e}")
        return []
    
def lambda_handler(event, context):
    if event.get('RequestType') == "Delete":
        delete_from_s3()
        return {'statusCode': 200, 'body': json.dumps('SUCCESS')}

    domains = get_domains()
    if not domains:
        print("ERROR - Unable to fetch domain list")
        return {'statusCode': 500, 'body': json.dumps('FAILED - Unable to fetch domain list')}

    s3_obj = write_to_s3(domains)
    if not s3_obj:
        print("ERROR - Unable to write domain file to S3")
        return {'statusCode': 500, 'body': json.dumps('FAILED - Unable to write domain file to S3')}

    res = import_list(s3_obj)
    if res:
        print("Done")
        return {'statusCode': 200, 'body': json.dumps('SUCCESS')}
    else:
        print("ERROR - Import failed")
        return {'statusCode': 500, 'body': json.dumps('FAILED - Import failed')}
