import express from "express";

import cors from 'cors'
import 'dotenv/config'
import logger from './logger.js'
import connectDB from './config/mongoDBConnection.js'
import userRouter from "./route/userRoute.js"

// app config
const port = process.env.PORT || 4000
const app = express()
app.use(cors())
app.use(express.json());
await connectDB();

// api endpoints
app.use("/api/user", userRouter)

app.get("/", (req, res) => {
    logger.info('GET / - API Working');  // Log the request
    res.send("API Working");
  });
  
  app.listen(port, () => {
    logger.info(`Server started on PORT: ${port}`);
    console.log(`Server started on PORT:${port}`);
  });