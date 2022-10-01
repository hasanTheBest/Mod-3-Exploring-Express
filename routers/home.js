const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_CLIENT_SECRET);

/**
 * DB Connection
 * */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlxry.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("db is connected");

    // Collections
    const accessoryCollection = client
      .db("computerAccessories")
      .collection("accessories");
    const reviewCollection = client
      .db("computerAccessories")
      .collection("reviews");

    // get banner accessory
    router.get("/banner", async (req, res) => {
      const accessory = await accessoryCollection.findOne();
      res.send(accessory);
    });

    // get all accessories
    router.get("/accessories", async (req, res) => {
      const accessories = await accessoryCollection.find().limit(6).toArray();
      res.send(accessories);
    });

    // get a accessory by id
    router.get("/accessories/:id", async (req, res) => {
      const { id } = req.params;

      const query = {
        _id: ObjectId(id),
      };

      const accessory = await accessoryCollection.findOne(query);

      // send data
      res.send(accessory);
    });

    // get a accessory by id
    router.delete("/accessories/:id", async (req, res) => {
      const { id } = req.params;

      const query = {
        _id: ObjectId(id),
      };

      const response = await accessoryCollection.deleteOne(query);

      // send data
      res.send(response);
    });

    // post a accessories
    router.post("/accessories", async (req, res) => {
      const result = await accessoryCollection.insertOne(req.body);

      res.send(result);
    });

    // Get all review
    router.get("/reviews", async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });

    // post payment
    router.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseFloat(price) * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: "usd",
        payment_method_types: ["card"],
        // automatic_payment_methods: {
        //   enabled: true,
        // }, // With automatic_payment_methods enabled, Stripe automatically detects the payment methods relevant to your customer
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

module.exports = router;
