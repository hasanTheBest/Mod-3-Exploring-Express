const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const router = express.Router();

router.use(express.json());

/**
 * DB Connection
 * */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlxry.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Verify valid users
function verifyUser(req, res, next) {
  const token = req.headers.authorization;

  console.log("token", token);
  console.log("process", process.env.TOKEN_SECRET);

  if (!token) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }

  // verify token
  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
    console.log("token verified");
  });
}

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("computerAccessories").collection("users");
    const reviewCollection = client
      .db("computerAccessories")
      .collection("reviews");
    const purchaseCollection = client
      .db("computerAccessories")
      .collection("purchases");
    const paymentCollection = client
      .db("computerAccessories")
      .collection("payments");

    // Verify admin
    const verifyAdmin = async (req, res, next) => {
      const { email } = req.decoded;
      console.log("verifyAdmin", email);
      const userInDb = await userCollection.findOne({ email });
      if (userInDb.role === "admin") {
        console.log("verifiedAdmin");
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    // get user by email
    router.get("/", async (req, res) => {
      const { user } = req.query;

      const result = await userCollection.findOne({ email: user });

      res.send(result);
    });

    // update user with name and email
    router.put("/", async (req, res) => {
      const { email } = req.body;

      const filter = {
        email,
      };

      const options = {
        upsert: true,
      };

      const updateDoc = {
        $set: req.body,
      };

      const result = await userCollection.updateOne(filter, updateDoc, options);

      const token = jwt.sign({ email }, process.env.TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res.send({ result, token });
    });

    // the admin make a user admin
    router.put("/makeAdmin", async (req, res) => {
      const { id } = req.body;

      const filter = {
        _id: ObjectId(id),
      };

      const updateDoc = {
        $set: { role: "admin" },
      };

      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // Get all users
    router.get("/all", async (req, res) => {
      console.log("user/all");
      const users = await userCollection.find().toArray();

      res.send(users);
    });

    // Add review
    router.post("/review", async (req, res) => {
      const result = await reviewCollection.insertOne(req.body);

      res.send(result);
    });

    // Get all purchases
    router.get("/purchases", async (req, res) => {
      const result = await purchaseCollection.find().toArray();

      res.send(result);
    });

    // Get a purchase by id
    router.get("/purchase/:id", async (req, res) => {
      const { id } = req.params;

      const query = {
        _id: ObjectId(id),
      };

      const result = await purchaseCollection.findOne(query);

      res.send(result);
    });

    // add payment data to purchase
    router.put("/purchase/:id", async (req, res) => {
      const { id } = req.params;
      const payment = req.body;

      const query = {
        _id: ObjectId(id),
      };

      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await purchaseCollection.updateOne(query, updateDoc);
      const addPayment = await paymentCollection.insertOne(payment);

      res.send(result);
    });

    // Add purchase
    router.post("/purchase", async (req, res) => {
      const result = await purchaseCollection.insertOne(req.body);

      res.send(result);
    });

    // Get purchase by user
    router.get("/purchases/:id", async (req, res) => {
      const { id } = req.params;

      const result = await purchaseCollection.find({ email: id }).toArray();

      res.send(result);
    });

    // Delete order by user
    router.delete("/purchases/:id", async (req, res) => {
      const { id } = req.params;

      const result = await purchaseCollection.deleteOne({
        _id: ObjectId(id),
      });

      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

module.exports = router;
