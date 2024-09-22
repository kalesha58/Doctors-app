import express from "express";

import cors from 'cors'
import 'dotenv/config'
import logger from './logger.js'

// app config
const app = express()
const port = process.env.PORT || 4000

app.get("/", (req, res) => {
    logger.info('GET / - API Working');  // Log the request
    res.send("API Working");
  });
  
  app.listen(port, () => {
    logger.info(`Server started on PORT: ${port}`);
    console.log(`Server started on PORT:${port}`);
  });