const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");

const Pole = require("../models/Pole");
const Transformer = require("../models/Transformer");

const TOTAL_TRANSFORMERS = 20;
const TOTAL_POLES = 500;

const generateRandomOffset = () => {
  return (Math.random() - 0.5) * 0.001;
};

const generateNetwork = async () => {
  try {
    await connectDB();

    console.log("Deleting old data...");

    await Pole.deleteMany({});//suppose we have made a seeder one time and then again we made some changes in seeder file then it can create a duplicate data
    await Transformer.deleteMany({});

    const transformers = [];
    const poles = [];

    let poleCounter = 1;

    for (let i = 1; i <= TOTAL_TRANSFORMERS; i++) {

      const transformerId = `T${String(i).padStart(3, "0")}`;//if i=1 so padStart means make the id of length 4 by adding 0 in starting 
     //T001
      const feederId = `F${Math.ceil(i / 2)}`;//It groups every two transformers under the same feeder
     //suppose i=1  1/2=1 feeder 1 get transformer 1..   i=2 2/2=1 feeder 1 get transformer 2
     //so one feeder has two transformer
      const baseLatitude = 12.90 + Math.random() * 0.30;
      const baseLongitude = 77.40 + Math.random() * 0.30;

      const households = Math.floor(Math.random() * 250) + 100;//generate value b/w 250 by addding 100 which is teh minimum value

      transformers.push({
        transformerId,
        feederId,
        latitude: baseLatitude,
        longitude: baseLongitude,
        capacity: 250,
        householdsServed: households,
      });

      const poleCount = Math.floor(Math.random() * 20) + 15;//how many poles a specific transformer must have

      let previousPole = null;//because first pole is connected to transformer itself

      for (let j = 1; j <= poleCount && poleCounter <= TOTAL_POLES; j++) {

        const poleId = `P${String(poleCounter).padStart(4, "0")}`;

        const hasDevice = Math.random() > 0.1;//means 90% pole must be on and 10% shoudl be off 

        poles.push({
          poleId,

          latitude: baseLatitude + generateRandomOffset(),

          longitude: baseLongitude + generateRandomOffset(),

          pincode: "560001",

          transformerId,

          feederId,

          parentPoleId: previousPole,

          sequenceOnLine: j,

          hasDevice,

          deviceId: hasDevice
            ? `DEV${String(poleCounter).padStart(4, "0")}`
            : null,
        });

        previousPole = poleId;//update the previous poel absically storing its parent 

        poleCounter++;
      }
    }

    await Transformer.insertMany(transformers);

    await Pole.insertMany(poles);

   

    console.log(`Total Transformers are: ${transformers.length}`);

    console.log(`Total Poles  are : ${poles.length}`);

    console.log("Dummy Network Generated Successfully");

  

    mongoose.connection.close();

  } catch (error) {

    console.error(error);

    mongoose.connection.close();
  }
};

generateNetwork();