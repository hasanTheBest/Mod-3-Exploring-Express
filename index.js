const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

// routes
const user = require("./routers/user");
const home = require("./routers/home");

// Error handling
const logErrors = require("./errorHandlers/logErrors");
const clientErrorHandler = require("./errorHandlers/clientErrorHandler");
const errorHandler = require("./errorHandlers/errorHandler");

const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(methodOverride());

// Routes
app.use("/", home);
app.use("/user", user);

// base url
app.get("/", (req, res) => {
  res.send("Computer Accessories Server running");
});

// Error handlers
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

// listen to the port
app.listen(port, () => {
  console.log("Computer Accessories  listening to the port", port);
});
