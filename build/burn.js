'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AWS = require("aws-sdk");
AWS.config.update({ region: 'ap-southeast-2' });
var Promise = require('es6-promise').Promise;
var ec2 = new AWS.EC2();
var moment = require("moment");

var burnAMI = function () {
  function burnAMI() {
    _classCallCheck(this, burnAMI);
  }

  _createClass(burnAMI, [{
    key: 'listEC2',
    value: function listEC2() {
      return new Promise(function (resolve, reject) {

        ec2.describeInstances({}, function (err, data) {
          if (err) {
            reject(err);
          } else {
            console.log(data);
            resolve(data);
          }
        });
      });
    }
  }, {
    key: 'getInstances',
    value: function getInstances() {
      return new Promise(function (resolve, reject) {
        var EC2_tags = listEC2().then(function (data) {
          var backup_instances_tags = filterTags(data);
          resolve(backup_instances_tags);
        });
      });
    }
  }, {
    key: 'registerAMI',
    value: function registerAMI(instance) {

      if (parseInt(instance.counter) <= 5) {
        var params = {
          InstanceId: instance.details.id,
          Name: instance.details.name_date
        };
        ec2.createImage(params, function (err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          console.log(data); // successful response
        });
      } else {
        console.log("deregister");
        deregisterAMI(instance);
      }
    }
  }, {
    key: 'deregisterAMI',
    value: function deregisterAMI(expiry) {
      return new Promise(function (resolve, reject) {
        ec2.describeImages(params = { Owners: ['791606823516'] }, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }).then(function (data) {
        data.Images.map(function (instance) {
          if (instance.Name.includes(expiry.details.name_date)) {
            var params = {
              ImageId: instance.ImageId
            };
            ec2.deregisterImage(params, function (err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else console.log(data); // successful response
            });
          }
        });
      });
    }
  }, {
    key: 'filterTags',
    value: function filterTags(data) {
      Instances = new Array();
      var current_time = new moment().format(" YYYYMMDD");
      data.Reservations.map(function (instance) {
        instance.Instances[0].Tags.map(function (tag) {
          if (tag.Key == 'Backup' && tag.Value == 'True') {
            Instance_set = {};
            var Instance_name = instance.Instances[0].Tags.find(function (o) {
              return o.Key === 'Name';
            });
            Instance_set.id = instance.Instances[0].InstanceId;
            Instance_set.name = Instance_name.Value;
            Instance_set.name_date = Instance_name.Value.concat(current_time);
            Instance_set.date = current_time;
            Instances.push(Instance_set);
          }
        });
      });
      return Instances;
    }
  }, {
    key: 'listAMIs',
    value: function listAMIs(instances) {
      console.log(instances);
      return new Promise(function (resolve, reject) {
        ec2.describeImages(params = { Owners: ['791606823516'] }, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.Images);
          }
        });
      }).then(function (data) {
        var AMI_burn_set = new Array();
        instances.map(function (tagged_instance) {
          var AMI_pair = {};
          var i = 0;
          AMI_pair.counter = 0;
          data.map(function (ami) {
            if (ami.Name.includes(tagged_instance.name)) {
              //when at least one burnt AMI exsiting then check the number
              AMI_pair.details = tagged_instance;
              AMI_pair.counter = ++i;
              AMI_burn_set.push(AMI_pair);
            } else {
              //when nothing exists
              AMI_pair.details = tagged_instance;
              AMI_burn_set.push(AMI_pair);
            }
          });
        });

        //check if the first position of this element in the array is equal to the current position
        uniqueArray = AMI_burn_set.filter(function (element, initial_position) {
          return AMI_burn_set.indexOf(element) == initial_position;
        });
        uniqueArray.map(function (instance) {
          if (parseInt(instance.counter) == 0) {
            console.log("-------------First AMI-------------");
            var params = {
              InstanceId: instance.details.id,
              Name: instance.details.name_date
            };
            ec2.createImage(params, function (err, data) {
              console.log(data); // successful response
            });
          } else {
            console.log("-------------More than one AMI exisiting for the instance-------------");
            registerAMI(instance);
          }
        });
      });
    }
  }]);

  return burnAMI;
}();

exports.default = burnAMI;
//# sourceMappingURL=burn.js.map