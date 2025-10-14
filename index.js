// importing dependencies
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const { default: mongoose } = require("mongoose");
const date = new Date();
const todaysDate = date.toISOString().split("T")[0];

// asynchronous function to start server
const startServer = async () => {
  try {
    await connectDB(); // start server first

    // mounting middleware after starting server
    app.use(cors());
    app.use(express.static("public"));
    app.use(express.urlencoded({ extended: false }));

    // once we've started server, mounted middlewares. Let's roll

    // creating schemas for mongodb
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true },
    });

    const exerciseSchema = new mongoose.Schema({
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: {
        type: String,
      },

      //Stores the ID of the parent User document
      refId: {
        type: mongoose.Schema.Types.ObjectId, // Defines the type as an ObjectId
        ref: "userModel", // The collection this ID references
        required: true,
      },
    });

    // creating a model that would use Schema
    const userModel = mongoose.model("userModel", userSchema);
    const exerciseModel = mongoose.model("exerciseModel", exerciseSchema);

    // handling routes
    app.get("/", (req, res) => {
      res.sendFile(__dirname + "/views/index.html");
    });

    // when a push is made to add a user
    app
      .route("/api/users")
      .post(async (req, res) => {
        // conditionally creating a new user with the requested username, only if user doesn't exist already
        try {
          const existingMatchUser = await userModel.findOne({
            username: req.body.username,
          });
          if (!existingMatchUser) {
            let newUser = new userModel({ username: req.body.username });
            let savedUser = await newUser.save();
            console.log("saved new user successfully");
            res.json(savedUser);
          } else {
            console.log("duplicate user entry detected");
          }
        } catch (err) {
          console.error("error creating and saving user", err);
          res.status(400).json({ error: "User already exists" });
        }
      })
      // chaining a get request to output all existing users to our console
      .get(async (req, res) => {
        try {
          const allUsers = await userModel.find();
          res.send(allUsers);
        } catch (err) {
          console.error("error fetching all users", err);
        }
      });

    // Adding exercises and stuffs to a user that already exists
    app.post("/api/users/:_id/exercises", async (req, res) => {
      let userId = req.params["_id"];

      try {
        const newExercise = new exerciseModel({
          description: req.body.description,
          duration: Number(req.body.duration),
          date: req.body.date || todaysDate,
          refId: userId,
        });
        //
        await newExercise.save();
        //
        if (newExercise) {
          const user = await userModel.findById(userId);
          res.json({
            _id: user._id,
            username: user.username,
            date: newExercise.date,
            duration: newExercise.duration,
            description: newExercise.description,
          });
        } else {
          res.status(400).json;
        }
      } catch (err) {
        console.error("error updating users record", err);
      }
    });

    app.get("/api/users/:_id/logs", async (req, res) => {
      // const { from, to, limit } = res.query;
      const requiredId = req.params["_id"];
      const requiredUser = await userModel.findById(requiredId);
      const requiredExercise = await exerciseModel.find({ refId: requiredId });
      const count = requiredExercise.length;

      //     // Filter by date if "from" or "to" provided

      let logs = requiredExercise.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date,
      }));
      //
      // if (from) {
      //   const fromDate = new Date(from);
      //   logs = exercises.filter((e) => new Date(e.date) >= fromDate);
      // }
      // if (to) {
      //   const toDate = new Date(to);
      //   logs = exercises.filter((e) => new Date(e.date) <= toDate);
      // }

      // // Limit if provided
      // if (limit) {
      //   logs = exercises.slice(0, Number(limit));
      // }

      // what this endpoint is actually
      const logsResponse = {
        username: requiredUser.username,
        count: count,
        _id: requiredId,
        log: logs,
      };

      if (logsResponse) {
        res.json(logsResponse);
      }
    });

    //when we are done with handling routes and shii, we'd start our server

    const listener = app.listen(process.env.PORT || 5000, () => {
      console.log("Your app is listening on port " + listener.address().port);
    });
  } catch (err) {
    console.error("error whilst starting server", err);
    process.exit(1);
  }
};

startServer();
