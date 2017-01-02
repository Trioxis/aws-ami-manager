var AWS = require("aws-sdk");
AWS.config.update({region: 'ap-southeast-2'});
var Moment = require("moment");
var limit = 3;
var ec2 = new AWS.EC2();
var AMI_storage = [];
'use strict';

class AMI{

  constructor () {}

  listEC2 () {
    return new Promise((resolve, reject) => {
      let Instance_set = {};
      let Instances = []; // Instance details
      ec2.describeInstances({}, function(err, response) {
              if (err) {
                  reject(err);
              } else {
                  let current_time = new Moment().format(" YYYYMMDD");
                  let ec2_list = response.Reservations.map(instanceResponse =>{
                      instanceResponse.Instances[0].Tags.map(instanceTags => {
                         if(instanceTags.Key == 'Backup' && instanceTags.Value == 'True'){
                           Instance_set = {};
                           let Instance_name = instanceResponse.Instances[0].Tags.find( o => o.Key === 'Name');
                           Instance_set.id = instanceResponse.Instances[0].InstanceId;
                           Instance_set.name = Instance_name.Value;
                           Instance_set.name_date = Instance_name.Value.concat(current_time);
                           Instances.push(Instance_set);
                         }
                      });
                      resolve(Instances);
                  });
              }
      });
    });
  }

  listAMIs() {
    return new Promise((resolve, reject) => {
        ec2.describeImages({Owners:['791606823516']}, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.Images);
          }
      });
    });
  }


  countAMIs(data, Instances) {
    let AMI_burn_set = [];
      Instances.map(tagged_instance => {
        let AMI_pair = {};
        let i = 0;
        AMI_pair.counter = 0;
        data.map(ami =>{
          if(ami.Name.includes(tagged_instance.name)){
            AMI_pair.details=tagged_instance;
            AMI_storage.push(ami);
            AMI_pair.counter=++i;
            AMI_burn_set.push(AMI_pair);
          }else{
            AMI_pair.details=tagged_instance;
            AMI_burn_set.push(AMI_pair);
          }
        });
      });

      let uniqueArray = AMI_burn_set.filter(function(element, initial_position) {
         return AMI_burn_set.indexOf(element) == initial_position;
      });
      return uniqueArray;
    }



  burn_or_not(instance) {
    if(parseInt(instance.counter) <= limit)
    {
      return true;
    }else{
      return false;
    }
  }


 registerAMI(instance) {
    var params = {
      InstanceId : instance.details.id,
      Name : instance.details.name_date
    };
    ec2.createImage(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      }  else{
        console.log(data);
        // return true;
      }
    });
  }


 deregisterAMI(expired_instance) {
  let numberPattern = /\d+/g;

  let leastDate = parseInt(AMI_storage[0].Name.replace(/\D/g, ''));
  let leastInstance = {};

  AMI_storage.map(private_AMI => {
    if(private_AMI.Name.includes(expired_instance.details.name)){
      if(leastDate > parseInt(private_AMI.Name.replace(/\D/g, ''))){
        leastDate = parseInt(private_AMI.Name.replace(/\D/g, ''));
      }
    }
  });

  AMI_storage.map(private_AMI => {
    if(private_AMI.Name.includes(expired_instance.details.name)
       && private_AMI.Name.includes(leastDate)){
       console.log(private_AMI.Name);
       var params = {
         ImageId : private_AMI.ImageId
       };
       ec2.deregisterImage(params, function(err, data) {
         if (err) console.log(err, err.stack); // an error occurred
         else     console.log(data);           // successful response
       });
    }
  });
 }


}

export default AMI;
