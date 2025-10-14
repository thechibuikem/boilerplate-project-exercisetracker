require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`); // tell me thst I've connected successfully if I have
  } catch (err) {
    console.log("error connecting to mongo db", err);
  }
};

module.exports = connectDB;
