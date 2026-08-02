const mongoose = require("mongoose");

const transformerSchema = new mongoose.Schema(
  {
    transformerId: {
      type: String,
      required: true,
      unique: true,
    },

    feederId: {
      type: String,
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,//how much capacity of load a transformer can hold
    },

    householdsServed: {
      type: Number,
      required: true,//specific transformer supplies electricity to that no. of houses
    },//It tells us how many houses are connected to the transformer. If two faults happen, we can repair the one affecting more houses first.
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transformer", transformerSchema);