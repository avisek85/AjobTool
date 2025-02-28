require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async ()=>{
    try {
  


        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongodb Connected");
    } catch (error) {
        console.error('Mongodb Connecion Error1: ',error);
        process.exit(1);
    }
};


module.exports = connectDB;