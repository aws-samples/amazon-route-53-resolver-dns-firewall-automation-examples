## Sample Amazon Route 53 Resolver DNS Firewall Rule Group
This CloudFormation stack deploys the following recommended DNS Firewall rules in a DNS Firewall rule group. We recommend this configuration because it provides a balanced security approach: blocking high-confidence threats immediately while generating alerts for lower-confidence detections. The inclusion of the AWS Managed Aggregate Threat List is particularly valuable as it combines domains from multiple threat categories (malware, ransomware, botnet, spyware, and DNS tunneling) into a blocklist. This consolidated list includes all domains from other AWS Managed Domain Lists, including those identified by Amazon GuardDuty's threat intelligence systems, giving you broad protection against known malicious domains while the Advanced rules catch previously unseen threats. For enterprise environments, you can scale this protection across your entire organization by using AWS Firewall Manager to automatically deploy and manage this rule group configuration consistently across all VPCs in your AWS Organization.

This CloudFormation template creates a DNS Firewall rule group with the AWS managed aggregate threat domain list and [DNS Firewall Advanced](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/firewall-advanced.html) rules for protecting against advanced DNS threats:
* BLOCK - [AWS Managed Aggregate Threat List](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)
* BLOCK - DNS Tunneling (High Confidence)
* BLOCK - Domain Generation Algorithms (High Confidence)
* ALERT - DNS Tunneling (Low Confidence)
* ALERT - Domain Generation Algorithms (Low Confidence)


## Getting Started
1. Clone the repository
2. Navigate to the desired solution folder
3. Follow the deployment instructions in each solution's README

***

## License Summary

This sample code is made available under the MIT-0 license. See the LICENSE file.



