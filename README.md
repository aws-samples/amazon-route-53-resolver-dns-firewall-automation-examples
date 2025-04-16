# Amazon Route 53 Resolver DNS Firewall Automation Examples
This repository contains CloudFormation templates and automation scripts for Amazon Route 53 Resolver DNS Firewall configurations. 

## Examples

#### DNS Firewall Advanced Sample Rule Group
* Located in `/sample-rule-group`

A CloudFormation template that creates a DNS Firewall rule group with recommended AWS managed domain list and [DNS Firewall Advanced](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/firewall-advanced.html) rules for protecting against advanced DNS threats:
* BLOCK - [AWS Managed Aggregate Threat List](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)
* BLOCK - DNS Tunneling (High Confidence)
* BLOCK - Domain Generation Algorithms (High Confidence)
* ALERT - DNS Tunneling (Low Confidence)
* ALERT - Domain Generation Algorithms (Low Confidence)

#### Abuse.CH
* Located in `/Abuse.ch`

This solution demonstrates an automated approach for creating a DNS Firewall domain list, leveraging an AWS Lambda function to parse an external source (https://abuse.ch), and keep the rule group automatically up to date.

<img src=/R53DomainListSamplesOverview.png>

## Getting Started
1. Clone the repository
2. Navigate to the desired solution folder
3. Follow the deployment instructions in each solution's README

***

## License Summary

This sample code is made available under the MIT-0 license. See the LICENSE file.
