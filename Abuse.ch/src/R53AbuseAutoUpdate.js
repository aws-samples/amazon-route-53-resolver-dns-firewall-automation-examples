var AWS = require("aws-sdk");
var https = require("https");

const s3 = new AWS.S3();
const route53resolver = new AWS.Route53Resolver();

var hostfileUrl = "https://urlhaus.abuse.ch/downloads/hostfile/";

async function importList (s3Obj){
    var params = {
      DomainFileUrl: s3Obj,
      FirewallDomainListId: "rslvr-fdl-546e4a1e7034fdd",
      Operation: "REPLACE"
    };
    
    let res = await route53resolver.importFirewallDomains(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log("Updating the domain list using " + s3Obj);
    }).promise();
    return res;
}

async function writeToS3(domains){
  var params = {
    Bucket: "r53-t1-s3bucket-1kxu9zmfu28em",
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
  var params = {
    Bucket: "r53-t1-s3bucket-1kxu9zmfu28em",
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
  var listOfDomains = [];
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

  let domains = await getDomains();
  if (domains.length) {
    let s3Obj = await writeToS3(domains, event.key);
    if (s3Obj) {
      let res = await importList(s3Obj);
      if (res) {
        console.log("Done");
      } else {
        console.log("ERROR - Import failed");
      }                
    } else {
      console.log("ERROR - Unable to write domain file to S3");
    }
  } else {
    console.log("ERROR - Unable to fetch domain list");
  }
  
  return;
};
