require("dotenv").config();
const express = require("express");
const {  Pool } = require("pg");
//importing and intializing express server
const app = express();
const port = 3000;
//Loading connection string from .env file
const connectionString = process.env.CONNECTION_STRING;
//Intiating  connection with datatbase
const pool = new Pool({
  connectionString: connectionString, 
  max:20, 
  idleTimeoutMillis:30000, 
   connectionTimeoutMillis:5000
});
//Checking db connection
pool.query("SELECT NOW()",(err,res)=>{
    if(err){
        console.log("Error connecting to db", err)
    }else{
        console.log("connection Sucessfull")
    }
})
//Intializing the TABLE 
async function IntializingTable() { 
    try {
        await pool.query(
            `
             CREATE TABLE IF NOT EXISTS school( 
               id SERIAL PRIMARY KEY, 
               name VARCHAR(255) NOT NULL, 
               address TEXT NOT NULL, 
               latitude FLOAT,
               longitude FLOAT
             ); 

            ` 
            
        )
        console.log("Table Creation Sucessfull");
    } catch (error) {
        console.error('Error creating school table:', err);
    }
    
}
IntializingTable()

//Middleware to parse JSON BODIES   
app.use(express.json())
//endpoint to add Scho0ll 
app.post("/addSchool", async(req,res)=>{
    const{name, address, latitude,longitude} = req.body  
    //Input Validation 
    if(!name || typeof name !== "string" || !address || typeof address !== "string" || typeof latitude !== 'number' || typeof longitude !== "number"){
        return res.status(400).json({message:"Bad Request"})
    } 
    try {
        //Inserting data
        const result = await pool.query(
            "INSERT INTO school(name, address, latitude, longitude) VALUES($1,$2,$3,$4) RETURNING *",[name, address,latitude,longitude]   


        ) 
        return res.status(201).json({message:"School added Sucessfully", school:result})
    } catch (error) {
        console.log(error) 
        return res.status(500).json({message:"Something Went Wrong"})
    }

})
//endpoint for fetching schooll
app.get("/listSchool", async(req,res)=>{
  const {latitude, longitude} = req.query  
  //Input Validation
  const  userLat = parseFloat(latitude) 
  const userLng  = parseFloat(longitude)  
  
  if (isNaN(userLat) || isNaN(userLng)){
     return res.status(400).json({message:"Bad Request"})
  } 
  try {
     //CaLculating the near distance between Schooll lat long and user lat long using the Havershine distance and Sorting the according to distance
     const query = ` 
        SELECT *,
        (
          6371 * acos(
            cos(radians($1)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) *
            sin(radians(latitude))
          )
        ) AS distance
      FROM school
      ORDER BY distance ASC;
      ` 
    const result = await pool.query(query, [userLat,userLng])   
    res.status(200).json({school:result.rows})
  } catch (error) {
    console.log(error) 
    return res.status(500).json({message:"Something Went Wrong"})
  }

})
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});
