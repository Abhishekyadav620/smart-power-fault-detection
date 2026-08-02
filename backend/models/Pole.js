const mongoose = require("mongoose");

const poleSchema = new mongoose.Schema(
  {
    poleId: {
      type: String,
      required: true,
      unique: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    transformerId: {
      type: String,
      required: true,
    },

    feederId: {
      type: String,
      required: true,
    },

    parentPoleId: {
      type: String,
      default: null,
    },

    sequenceOnLine: {
      type: Number,
      default: null,
    },

    hasDevice: {
      type: Boolean,
      default: true,//it will store jst a true and false act like an iot device
      //true means that the specific pole has iot device installed
      //false means does not have iot device installed
    },

    deviceId: {
      type: String,
      default: null,//the unique id of the iot device being installed
      //because every pole must know from where the message of on or off has came
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pole", poleSchema);

// {
//    "poleId":"P101",
//    "hasDevice":true,
//    "deviceId":"DEV-1001"
// }

// {
//    "poleId":"P101",
//    "hasDevice":false,
//    "deviceId":null
// }//no iot device