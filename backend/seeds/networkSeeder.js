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

      const transformerPoles = [];

      for (let j = 1; j <= poleCount && poleCounter <= TOTAL_POLES; j++) {
        const poleId = `P${String(poleCounter).padStart(4, "0")}`;
        const hasDevice = Math.random() > 0.1; // 90% pole must be on

        let parentPoleId = null;
        if (j > 1) {
          // Pick a random parent from previously created poles for this transformer
          // To make it look like a balanced tree, we can pick a parent that has < 3 children
          // But random selection among all previous poles naturally creates branches
          const parentIndex = Math.floor(Math.random() * transformerPoles.length);
          parentPoleId = transformerPoles[parentIndex].poleId;
        }

        const newPole = {
          poleId,
          latitude: baseLatitude + generateRandomOffset(),
          longitude: baseLongitude + generateRandomOffset(),
          pincode: "560001",
          transformerId,
          feederId,
          parentPoleId,
          sequenceOnLine: j,
          hasDevice,
          deviceId: hasDevice
            ? `DEV${String(poleCounter).padStart(4, "0")}`
            : null,
        };

        poles.push(newPole);
        transformerPoles.push(newPole);

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