const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const res = await Incident.updateMany({ status: 'Open' }, { $set: { status: 'DETECTED' } });
    console.log('Updated incidents:', res.modifiedCount);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}).catch(console.error);
