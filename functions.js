const { MongoClient, MongoServerSelectionError } = require("mongodb");

alert('this is mongo function.js')

const uri = 'mongodb+srv://cproffi2:mobility2025@cluster0.htrpa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&socketTimeoutMS=60000&connectTimeoutMS=60000';
const options = {
    serverSelectionTimeoutMS: 5000, // Wait max 5 sec for server
    connectTimeoutMS: 60000, // Increase connection timeout
    socketTimeoutMS: 120000, // Allow longer socket timeout
    maxPoolSize: 20 // Increase connection pool size
};

const client = new MongoClient(uri, options);
const dbName = "BCCData";
const collectionName = "LACityData";

let begDate = "'2010-01-01T00:00:00'"
let endDate = "'2025-12-31T23:59:00'"


const url = 'https://data.lacity.org/resource/d5tf-ez2w.json?$$app_token=lcZ3ldLd1WSCiqcpKHR6IF1r0'
+ '&$limit=6000000'
+ `&$select= dr_no as dr_no, date_rptd as date_rptd, date_occ as date_occ, area_name as area_name, time_occ as time_occ,  mocodes as mocodes, vict_age as vict_age, vict_sex as vict_sex, vict_descent as vict_descent, location as street1, cross_street as street2, location_1 as coords where date_occ >= ${begDate} and date_occ <= ${endDate} order by date_occ, time_occ`




const cdCnt = (arr) => {

let cdObj = {};

let cdCnt = 0;
cdObj.noCodes = 0
let noCodeArr = [];
for(let obj of arr){


if(obj.mocodes){

for(let codes of obj.mocodes){


if(codes in cdObj){

cdObj[codes]++

}    

else cdObj[codes] = 1

}

}

else{

noCodeArr.push(obj.dr_no)

    
cdObj.noCodes++

}


}

cdObj.noCdArr = noCodeArr;


return cdObj

}

async function createIndex() {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // ✅ Create an index on dr_no (only needs to be run once)
        await collection.createIndex({ dr_no: 1 }, { unique: true });

        console.log("✅ Index created successfully on dr_no.");
    } catch (error) {
        console.error("🚨 Error creating index:", error);
    } finally {
        await client.close();
    }
}


async function fetchData() {

    console.log("📡 Fetching data from API...");
    try {
     
        const response = await fetch(url);
       
        if(!response.ok) throw new Error('❌ API request failed');
       
        return await response.json();
        } catch (error) {

        console.error('error fetching data:', error)
        return [];
    }



}




async function transformData() {

    console.log("🔄 Transforming data...");
    
    const data = await fetchData();
    console.log(`📊 Data received: ${data.length} records`);
    const tArray = [];

for(let obj of data){
    if(obj.mocodes){
    obj.mocodes = obj.mocodes.split(' ')
    }
    if(obj.street1) obj.street1 = obj.street1?.replace(/\s+/g, " ");
    
    if(obj.street2) obj.street2 = obj.street2?.replace(/\s+/g, " ");
    
    if(obj.coords?.human_address) delete obj.coords.human_address
    
   

    
    //console.log(`this is the area name ${obj.area_name} and this is if it's older than today ${obj.year} is ${dateGetter(obj.year)}`)
   // console.log((obj))


   console.log("✅ Data transformation complete.");
    tArray.push(obj)
   

  
}




// console.log(`total number of incidents for the date range ${begDate} to ${endDate} are ${data.length}`)
//    console.log(`fatalities are ${fatCnt}`)
return tArray;
}



async function insertDataIntoMongo(data) {
    console.log(`📝 Preparing to insert ${data.length} records into MongoDB...`);

    if (!data || data.length === 0) {
        console.log("🚨 No data to insert.");
        return;
    }

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log("🚀 Dropping index for faster inserts...");
    try {
        await collection.dropIndex("dr_no_1");
    } catch (error) {
        console.log("⚠️ Index doesn't exist yet, skipping drop.");
    }

    console.log("🔄 Checking for existing records...");
    const existingDocs = await collection.find({}, { projection: { dr_no: 1 } }).toArray();
    const existingSet = new Set(existingDocs.map(doc => doc.dr_no));

    const newData = data.filter(obj => !existingSet.has(obj.dr_no));
    const updateOps = data.filter(obj => existingSet.has(obj.dr_no)).map(obj => ({
        updateOne: {
            filter: { dr_no: obj.dr_no },
            update: { $set: obj }
        }
    }));

    console.time("⏳ Insert Time");

    if (newData.length > 0) {
        console.log(`🚀 Inserting ${newData.length} new records...`);
        await collection.insertMany(newData, { ordered: false });
    }

    if (updateOps.length > 0) {
        console.log(`🔄 Updating ${updateOps.length} existing records...`);
        await collection.bulkWrite(updateOps, { ordered: false });
    }

    console.timeEnd("⏳ Insert Time");

    console.log("🚀 Recreating index...");
    await collection.createIndex({ dr_no: 1 }, { unique: true });

    await client.close();
    console.log("🔌 MongoDB connection closed.");
}





transformData()
    .then(insertDataIntoMongo)
    .catch((err) => console.error("error", err)); 
    