const exprees = require('express');
const { v4: uuidv4 } = require('uuid');
const ip = require('ip');
const requestIp = require('request-ip');
const redis = require('redis');

let rclient;

const app =  exprees();
const port = process.env.NODE_PORT || 3000;

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://makarand:${process.env.DB_PASS}@autoscalingcluster.2rla7pz.mongodb.net/?retryWrites=true&w=majority&appName=AutoScalingCluster`;

const appId=uuidv4();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function connectDb() {
  try {
    rclient = await redis.createClient({
        url:`redis://172.31.12.229:6379`
    })
  .on('error', err => console.log('Redis Client Error', err))
  .connect();


  const serverPoolStr = await rclient.get('server-pool');
let serverPoolArr=[];
try{
    serverPoolArr=JSON.parse(serverPoolStr) || [];

}catch(errr){
    console.log(errr)
}
serverPoolArr.push(appId);
await rclient.set('server-pool',JSON.stringify(serverPoolArr));


    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
connectDb().catch(console.dir);

let numberOfRequests=0;
let averageTimeToRespond=0;

app.get('/',async (req,res)=>{
    const st=+new Date();
    
    let countStr=await rclient.get(`server-${appId}`);
    let counter=Number(countStr) || 0;
    counter++;
    await rclient.set(`server-${appId}`,`${counter}`);
    let ct=(+new Date()-st);
    if(counter%10==0){
        const dbName = "myDatabase";
        const collectionName = "recipes";
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
    
        let lastFiveDocs=[];
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
            lastFiveDocs = await collection.find({}).sort({ createdStamp: -1 }).limit(5).toArray()
            
          } catch (err) {
            console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
          }
        let responseTime=(+new Date()-st);
        let totalTime=(averageTimeToRespond*numberOfRequests)+responseTime;
        ++numberOfRequests;
        averageTimeToRespond=totalTime/numberOfRequests;
        console.log(` ${appId} :: ${new Date()} ::  ART:${Math.ceil(averageTimeToRespond)}\n`);
        res.send({
            counter,
            cacheResponseTime:ct,
            responseTime,
            averageTimeToRespond:Math.ceil(averageTimeToRespond),
            lastFiveDocs,
        })
    }else{
        res.send({
            counter,
            cacheResponseTime:ct,
        })
    }

    
})

app.get('/data',async (req,res)=>{
    const st=+new Date();
    
    let countStr=await rclient.get(`server-${appId}`);
    let counter=Number(countStr) || 0;
    counter++;
    await rclient.set(`server-${appId}`,`${counter}`);
    let ct=(+new Date()-st);
    if(true){
        const dbName = "myDatabase";
        const collectionName = "recipes";
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
    
        let lastFiveDocs=[];
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
            lastFiveDocs = await collection.find({}).sort({ createdStamp: -1 }).limit(5).toArray()
            
          } catch (err) {
            console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
          }
        let responseTime=(+new Date()-st);
        let totalTime=(averageTimeToRespond*numberOfRequests)+responseTime;
        ++numberOfRequests;
        averageTimeToRespond=totalTime/numberOfRequests;
        console.log(` ${appId} :: ${new Date()} ::  ART:${Math.ceil(averageTimeToRespond)}\n`);
        res.send({
            counter,
            cacheResponseTime:ct,
            responseTime,
            averageTimeToRespond:Math.ceil(averageTimeToRespond),
            lastFiveDocs,
        })
    }

    
})

app.listen(port,()=>{
    console.log(`app running on port : ${port}`)
})

/*

ulimit -n 10000

ab -k -c 50 -n 5000 http://app-auto-scalling-group-1-36646228.ap-south-1.elb.amazonaws.com/

*/