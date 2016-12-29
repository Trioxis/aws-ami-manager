"use strict";

var _burnAMI = require("./burnAMI");

var _burnAMI2 = _interopRequireDefault(_burnAMI);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ec2 = new _burnAMI2.default();

var instances = ec2.listEC2().then(function (tagged_instance) {
  ec2.listAMIs().then(function (data) {
    // console.log(data);
    var burnt_images_info = ec2.countAMIs(data, tagged_instance);
    // console.log(burnt_images_info);
    burnt_images_info.map(function (instance_info) {
      if (parseInt(instance_info.counter) == 0) {
        console.log("---- First time to burn ---- " + instance_info.details.name);
        var params = {
          InstanceId: instance_info.details.id,
          Name: instance_info.details.name_date
        };
        ec2.createImage(params, function (err, data) {
          console.log(data); // successful response
        });
      } else {
        console.log("-----------------------------------------");
        console.log(instance_info.counter + " AMIs exisiting for " + instance_info.details.name);
        var yes_or_no = ec2.burn_or_not(instance_info);
        console.log(yes_or_no);
        if (yes_or_no) {
          console.log("burn");
          ec2.registerAMI(instance_info);
        } else {
          console.log("deregister");
          ec2.deregisterAMI(instance_info);
        }
      }
    });
  });
}).catch(function (error) {
  console.log(error);
});
//# sourceMappingURL=index.js.map