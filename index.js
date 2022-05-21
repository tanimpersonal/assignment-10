const express = require("express");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.port || 5000; //first part needs for heroku
const app = express();
//middleware
app.use(cors());
app.use(express.json());
//mongo connect

const uri =
  "mongodb+srv://dbuser1:89NuSGyMNpr6nn4o@cluster0.755op.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("inside verifyJWT" + authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    console.log(decoded);
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("assignment-10").collection("services");
    const orderCollection = client.db("assignment-10").collection("orders");
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);

      console.log(service);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
    });
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    //auth token
    app.post("/login", async (req, res) => {
      const user = req.body;

      console.log(user);

      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });
    //order collection
    app.post("/orders", async (req, res) => {
      const order = req.body;
      console.log(order);
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    //all orders
    app.get("/orders", verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const decodedEmail = req.decoded.userEmail;
      if (email === decodedEmail) {
        const query = { email: email }; //find email in every email field
        const cursor = orderCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "forbiodden" });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running hola");
});
app.listen(port, () => {
  console.log(port);
});
