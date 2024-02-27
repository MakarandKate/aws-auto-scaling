const exprees = require('express');
const { v4: uuidv4 } = require('uuid');
const ip = require('ip');
const requestIp = require('request-ip');

const app =  exprees();
const port = process.env.NODE_PORT || 3000;

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://makarand:${process.env.DB_PASS}@autoscalingcluster.2rla7pz.mongodb.net/?retryWrites=true&w=majority&appName=AutoScalingCluster`;

const appId=uuidv4();;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


app.get('/',async (req,res)=>{
    await client.connect();

    const dbName = "myDatabase";
    const collectionName = "recipes";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);


    const recipes = [
        {
            appId,
            createdStamp:+new Date(),
            ip:ip.address(),
            clientIp : requestIp.getClientIp(req)
        }
      ];

      try {
        const insertManyResult = await collection.insertMany(recipes);
        console.log(`${insertManyResult.insertedCount} documents successfully inserted.\n`);
      } catch (err) {
        console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
      }
    await client.close();
    res.send('<h1>Auto Scaling Demo</h1>')
})

app.listen(port,()=>{
    console.log(`app running on port : ${port}`)
})