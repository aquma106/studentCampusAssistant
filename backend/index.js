const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

//Import routes
const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");

const app = express();
app.use(express.json());
app.use(cors());

//use routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("MongoDB Connected Successfully..");
    app.listen(process.env.PORT, () => {
      console.log(
        `Student Campus Assistant Running on Port : ${process.env.PORT}`
      );
    });
  })
  .catch(() => {
    console.log("Something went wrong while database connection!..");
  });
