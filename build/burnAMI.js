"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AWS = require("aws-sdk");
AWS.config.update({ region: 'ap-southeast-2' });
var moment = require("moment");
var limit = 3;
var ec2 = new AWS.EC2();
var AMI_storage = new Array();
'use strict';

var AMI = function () {
  function AMI() {
    _classCallCheck(this, AMI);
  }

  _createClass(AMI, [{
    key: "listEC2",
    value: function listEC2() {
      return new Promise(function (resolve, reject) {
        var Instance_set = {};
        var Instances = new Array(); // Instance details
        ec2.describeInstances({}, function (err, response) {
          if (err) {
            reject(err);
          } else {
            (function () {
              var current_time = new moment().format(" YYYYMMDD");
              var ec2_list = response.Reservations.map(function (instanceResponse) {
                instanceResponse.Instances[0].Tags.map(function (instanceTags) {
                  if (instanceTags.Key == 'Backup' && instanceTags.Value == 'True') {
                    Instance_set = {};
                    var Instance_name = instanceResponse.Instances[0].Tags.find(function (o) {
                      return o.Key === 'Name';
                    });
                    Instance_set.id = instanceResponse.Instances[0].InstanceId;
                    Instance_set.name = Instance_name.Value;
                    Instance_set.name_date = Instance_name.Value.concat(current_time);
                    Instances.push(Instance_set);
                  }
                });
                resolve(Instances);
              });
            })();
          }
        });
      });
    }
  }, {
    key: "listAMIs",
    value: function listAMIs() {
      return new Promise(function (resolve, reject) {
        ec2.describeImages({ Owners: ['791606823516'] }, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.Images);
          }
        });
      });
    }
  }, {
    key: "countAMIs",
    value: function countAMIs(data, Instances) {
      var AMI_burn_set = new Array();
      Instances.map(function (tagged_instance) {
        var AMI_pair = {};
        var i = 0;
        AMI_pair.counter = 0;
        data.map(function (ami) {
          if (ami.Name.includes(tagged_instance.name)) {
            AMI_pair.details = tagged_instance;
            AMI_storage.push(ami);
            AMI_pair.counter = ++i;
            AMI_burn_set.push(AMI_pair);
          } else {
            AMI_pair.details = tagged_instance;
            AMI_burn_set.push(AMI_pair);
          }
        });
      });

      var uniqueArray = AMI_burn_set.filter(function (element, initial_position) {
        return AMI_burn_set.indexOf(element) == initial_position;
      });
      return uniqueArray;
    }
  }, {
    key: "burn_or_not",
    value: function burn_or_not(instance) {
      if (parseInt(instance.counter) <= limit) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "registerAMI",
    value: function registerAMI(instance) {
      var params = {
        InstanceId: instance.details.id,
        Name: instance.details.name_date
      };
      ec2.createImage(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          console.log(data);
          // return true;
        }
      });
    }
  }, {
    key: "deregisterAMI",
    value: function deregisterAMI(expired_instance) {
      var numberPattern = /\d+/g;

      var leastDate = parseInt(AMI_storage[0].Name.replace(/\D/g, ''));
      var leastInstance = {};

      AMI_storage.map(function (private_AMI) {
        if (private_AMI.Name.includes(expired_instance.details.name)) {
          if (leastDate > parseInt(private_AMI.Name.replace(/\D/g, ''))) {
            leastDate = parseInt(private_AMI.Name.replace(/\D/g, ''));
          }
        }
      });

      AMI_storage.map(function (private_AMI) {
        if (private_AMI.Name.includes(expired_instance.details.name) && private_AMI.Name.includes(leastDate)) {
          console.log(private_AMI.Name);
          var params = {
            ImageId: private_AMI.ImageId
          };
          ec2.deregisterImage(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
          });
        }
      });
    }
  }]);

  return AMI;
}();

exports.default = AMI;
//# sourceMappingURL=burnAMI.js.map