const AWS = require("aws-sdk");
const response = require("cfn-response");
const https = require("https");

const s3 = new AWS.S3();
const route53resolver = new AWS.Route53Resolver();

const hostfileUrl = "https://urlhaus.abuse.ch/downloads/hostfile/";

async function importList (s3Obj){
    let params = {
      DomainFileUrl: s3Obj,
      FirewallDomainListId: "<REPLACE-WITH-YOUR-DOMAIN-LIST-ID>",
      Operation: "REPLACE"
    };
    
    let res = await route53resolver.importFirewallDomains(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log("Updating the domain list using " + s3Obj);
    }).promise();
    return res;
}

async function writeToS3(domains){
  let params = {
    Bucket: "<REPLACE-WITH-YOUR-BUCKET-NAME>",
    Key: "autoupdating-dnsfirewall-domains.txt",
    Body: domains.join('\n'),
    ContentType: "text/plain"
  };
  let res = await s3.putObject(params, function(err, data){
                    if (err) console.log(err, err.stack); // an error occurred
                  }).promise();
  if (res) {
    return "https://" + params.Bucket + ".s3.amazonaws.com/" + params.Key;
  }
}

async function deleteFromS3(){
  let params = {
    Bucket: "<REPLACE-WITH-YOUR-BUCKET-NAME>",
    Key: "autoupdating-dnsfirewall-domains.txt"
  };
  let res = await s3.deleteObject(params, function(err, data){
                    if (err) console.log(err, err.stack); // an error occurred
                  }).promise();
  if (res) {
    console.log("Deleted the import file");
  }
}

async function getDomains (){
  let listOfDomains = [];
    console.log("Fetching the list of domains from " + hostfileUrl);
    return new Promise((resolve, reject) => {
      const url = hostfileUrl;
      let dataString = '';
      let post_req = https.request(url, (res) => {
        res.setEncoding("utf8");
        res.on('data', chunk => {
          dataString += chunk;
        });
        res.on('end', () => {
          //console.log(dataString);
          listOfDomains = dataString
            .split(/\r?\n/)
            .filter((line) => line.match(/^\d+/))
            .map((line)=> {return line.replace(/127.0.0.1\t/,'')})
            .filter((line) => line.match(/^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.){1,127}(?![0-9]*$)[a-z0-9-]+\.?)$/));
          console.log("Fetched " + listOfDomains.length + " Domains");
          resolve(listOfDomains);
        });
        res.on('error', (err) => {
          reject(err);
        });
      });
      post_req.write("test");
      post_req.end();
    });
}

exports.handler = async (event, context) => {
  if (event.RequestType == "Delete") {
    await deleteFromS3();
    await response.send(event, context, "SUCCESS");
    return;
  }

  let domains = await getDomains();
  if (domains.length) {
    let s3Obj = await writeToS3(domains, event.key);
    if (s3Obj) {
      let res = await importList(s3Obj);
      if (res) {
        if (event.ResponseURL) await response.send(event, context, response.SUCCESS);
        console.log("Done");
      } else {
        console.log("ERROR - Import failed");
        if (event.ResponseURL) await response.send(event, context, response.FAILED);
      }                
    } else {
      console.log("ERROR - Unable to write domain file to S3");
      if (event.ResponseURL) await response.send(event, context, response.FAILED);
    }
  } else {
    console.log("ERROR - Unable to fetch domain list");
    if (event.ResponseURL) await response.send(event, context, response.FAILED);
  }
  
  return;
};
