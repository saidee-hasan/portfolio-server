const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  serialize,
} = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
const cookieParser = require("cookie-parser");
const e = require("express");
app.use(cookieParser());



app.use(cors());
require("dotenv").config();



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@portfolio.rt6id.mongodb.net/?retryWrites=true&w=majority&appName=portfolio`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("admission").collection("users");
    const addAdmissionCollection = client.db("admission").collection("student");
    const bannerCollection = client.db("admission").collection("banner");
    const addBestStudentCollection = client.db("admission").collection("best-student");
    const noticesCollection = client.db("admission").collection("notices");



// jwt token
app.post('/jwt',async(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'})
 res.send({token});

})

// verify admin  Token
const verifyAdmin = async(req,res,next)=>{
  const email  = req.decoded.email;
  const query = {email : email}
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'Admin'
  if(!isAdmin){
    return  res.status(401).send({message:'forbidden access'})
  }
  next()

}
const verifyModerator = async(req,res,next)=>{
  const email  = req.decoded.email;
  const query = {email : email}
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'Moderator'
  if(!isAdmin){
    return  res.status(401).send({message:'forbidden access'})
  }
  next()

}

//  middlewares
const verifyToken = (req,res,next)=>{

  if(!req.headers.authorization){
    return  res.status(401).send({message:'forbidden access'})

  }
const token = req.headers.authorization.split(' ')[1]
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err){
    return  res.status(401).send({message:'forbidden access'})
  }
  req.decoded = decoded;
  next()
})

 
}




    app.post('/users',async(req,res)=>{
      const user = req.body;
console.log(user)
      // insert email do does
      const query = { email: user.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


    // banner Section
    app.post('/banner/upload', async (req, res) => {
      const { image_url, title, description } = req.body;
    
   
    
      try {
        const bannerData = {
          image_url: image_url,
          title: title,
          description: description,
          created_at: new Date(),
        }; 
        const result = await bannerCollection.insertOne(bannerData);
        
        // Check if result is successful
        if (result.insertedId) {
          res.status(200).json({ 
            message: 'Image data saved successfully!',
            data: { ...bannerData, _id: result.insertedId }, // Include the Mongo _id
          });
        } else {
          throw new Error('Failed to insert data');
        }
    
      } catch (error) {
        console.error('Error saving image data:', error);
        res.status(500).json({ message: 'Failed to save image data. Please try again later.' });
      }
    });
    



    app.delete('/banner/delete/:id', async (req, res) => {
      const { id } = req.params;
    
      try {
        const result = await bannerCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Banner deleted successfully!' });
        } else {
          res.status(404).json({ message: 'Banner not found!' });
        }
      } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ message: 'Failed to delete banner. Please try again later.' });
      }
    });
    

    app.get('/banner', async (req, res) => {
      try {
        // Retrieve all banner data from the collection
        const banners = await bannerCollection.find().toArray();
        
        // Check if any banners were found
        if (banners.length === 0) {
          return res.status(404).json({ message: 'No banners found.' });
        }
        
        res.status(200).json({
          message: 'Banners retrieved successfully!',
          data: banners,
        });
        
      } catch (error) {
        console.error('Error retrieving banner data:', error);
        res.status(500).json({ message: 'Failed to retrieve banner data. Please try again later.' });
      }
    });
    
    // Admissson Data 
    app.get("/users",verifyToken, async (req, res) => {
   
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
  
    app.patch('/student/:id', async(req,res)=>{
      const id = req.params.id;
      const data =req.body;
     console.log(data)
      const filter= {_id : new ObjectId(id)}
      const updateDoc ={
        $set:{
          status :"successfully"
        }
      }
      const result = await addAdmissionCollection.updateOne(filter,updateDoc)
      res.send(result)
     
     
    })
    

    app.delete('/student/:id',verifyToken, async (req, res) => {
      const { id } = req.params;
    
      try {
        const result = await addAdmissionCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).send({ success: false, message: 'Coupon not found.' });
        }
        res.status(200).send({ success: true, message: 'Coupon deleted successfully.' });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).send({ success: false, message: 'Failed to delete coupon.' });
      }
    });
    app.get('/student',async (req,res)=>{
      
      const result = await addAdmissionCollection.find().toArray();
      res.send(result);
    })


    app.get('/student/:id', async (req, res) => {
      const studentId = req.params.id; // Access id from route parameter
    
      console.log('Student ID:', studentId); // Log studentId to make sure it's correct
    
      try {
        // Query the collection for the student with the specified _id
        const student = await addAdmissionCollection.findOne({ _id: new ObjectId(studentId) });
    
        if (!student) {
          return res.status(404).send({ success: false, message: 'Student not found' });
        }
    
        res.status(200).send({ success: true, student }); // Send the student data
      } catch (error) {
        console.error('Error retrieving student:', error);
        res.status(500).send({ success: false, message: 'Failed to retrieve student.', error });
      }
    });
    
// Fetch notices
app.get('/notices', async (req, res) => {
  try {
    const notices = await noticesCollection.find().toArray();
    res.status(200).json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).send('Failed to fetch notices');
  }
});

app.post('/notice', async (req, res) => {
  const { noticeText, noticeDescription, startDate, endDate } = req.body;

  // Check if any required field is missing
  if (!noticeText || !noticeDescription || !startDate || !endDate) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const newNotice = {
      noticeText,
      noticeDescription,
      startDate,
      endDate,
    };

    const result = await noticesCollection.insertOne(newNotice);
    res.status(201).json(result); // Send the result of the insert

  } catch (error) {
    console.error('Error adding notice:', error);
    res.status(500).send('Failed to add notice');
  }
});


// Delete a notice
app.delete('/notice/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await noticesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      res.status(404).send('Notice not found');
      return;
    }

    res.status(200).send('Notice deleted successfully');
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).send('Failed to delete notice');
  }
});



    app.get('/admissions',verifyToken, async (req, res) => {
      const { email, className } = req.query; // Extract query parameters
      
      let query = {}; // Initialize empty query object
      
      // Adjusted query to match the structure in your database
      if (email) query.userEmail = email;  // Assuming 'userEmail' is the field in your collection
      if (className) query.className = className;  // Assuming 'className' is the field in your collection
    
      try {
        // Query the database
        const admissions = await addAdmissionCollection.find(query).toArray();
    
        // Check if no results were found
        if (admissions.length === 0) {
          return res.status(404).json({ success: false, message: 'No matching admissions found.' });
        }
    
        // Return the found admissions
        res.status(200).json({ success: true, admissions });
    
      } catch (error) {
        console.error('Error retrieving admissions:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve admissions.', error });
      }
    });
    
    

    app.post('/admission',verifyToken,  async(req,res)=>{
      const item =req.body;
      console.log(item)
      const result = await addAdmissionCollection.insertOne(item);
      res.send(result);
    })
    
    app.get("/best-student", async (req, res) => {
   
      const result = await addBestStudentCollection.find().toArray();
      res.send(result);
    });
    app.delete("/best-student/:id", async (req, res) => {

      const { id } = req.params;
    
      try {
    
        const result = await addBestStudentCollection.deleteOne({ _id: new ObjectId(id) });
    
        res.status(200).send(result);
    
      } catch (error) {
    
        res.status(500).send({ message: 'Failed to delete product' });
    
      }
    
    });
        


    app.post('/best-student',  async(req,res)=>{
      const item =req.body;
      const result = await addBestStudentCollection.insertOne(item);
      res.send(result);
    })


    app.put("/admission/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      let updatedData = req.body;
    
      try {
        console.log("Received update request for:", id);
        console.log("Updated data:", updatedData);
    
        // Retrieve the current document
        const currentAdmission = await addAdmissionCollection.findOne({ _id: new ObjectId(id) });
    
        if (!currentAdmission) {
          return res.status(404).json({ success: false, message: "Admission not found" });
        }
    
        // Remove `_id` from `updatedData` to prevent conflicts
        delete updatedData._id;
    
        // Check if any changes exist
        const isSameData = Object.keys(updatedData).every(
          (key) => currentAdmission[key] === updatedData[key]
        );
    
        if (isSameData) {
          return res.status(400).json({ success: false, message: "No changes detected in the data" });
        }
    
        // Update the document in the database
        const result = await addAdmissionCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
    
        if (result.modifiedCount === 0) {
          return res.status(400).json({ success: false, message: "No changes were made" });
        }
    
        console.log("Update result:", result);
        res.json({ success: true, message: "Updated successfully", updatedData });
    
      } catch (error) {
        console.error("Error updating admission:", error);
        res.status(500).json({ success: false, message: "Failed to update admission" });
      }
    });
    
    
    







app.delete("/report/:id", async (req, res) => {

  const { id } = req.params;

  try {

    const result = await addPostCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).send(result);

  } catch (error) {

    res.status(500).send({ message: 'Failed to delete product' });

  }

});
app.delete("/users/:id",verifyToken,verifyAdmin, async (req, res) => {

  const { id } = req.params;

  try {

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).send(result);

  } catch (error) {

    res.status(500).send({ message: 'Failed to delete product' });

  }

});
    
    
 
    





  // user data get
  app.get("/users",verifyToken, async (req, res) => {
   
    const result = await usersCollection.find().toArray();
    res.send(result);
  });

  app.get('/users/:email',verifyToken, async (req, res) => {
    const email = req.params.email; // Access email from route parameter
    console.log(email); // Log to check if email is being passed correctly
    
    try {
      // Query the users collection for the user with the specified email
      const user = await usersCollection.findOne({ email });
  
      if (!user) {
        return res.status(404).send({ success: false, message: 'User not found for the provided email.' });
      }
  
      res.status(200).send({ success: true, user });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).send({ success: false, message: 'Failed to retrieve user.', error });
    }
  });
  
  


  app.get('/users/admin/:email',verifyToken,verifyAdmin,  async (req, res) => {
    const email = req.params.email;
  
  
    try {
      const query = { email };
      const user = await usersCollection.findOne(query);
 
      const roles = {
        admin: false,
        moderator: false,
        guest: false,
      };
  
      if (user?.role) {
        const role = user.role.toLowerCase(); // Case-insensitive match
        roles.admin = role === 'admin';
        roles.moderator = role === 'moderator';
        roles.guest = role === 'guest';
      }
     
      
      res.send(roles);
    } catch (error) {
      console.error('Error fetching user role:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  



  
  app.patch('/users/:email',verifyToken,verifyAdmin,  async (req, res) => {
    const email = req.params.email; // Get the email from the request parameters
    const { role, status } = req.body; // Destructure role and status from the request body
  
    const filter = { email: email }; // Use email to filter the user
    const updateDoc = {
      $set: {
        role: role,
        status: status // Update the status if needed
      }
    };
  
    try {
      const result = await usersCollection.updateOne(filter, updateDoc);
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'User  not found or no changes made.' });
      }
      res.send(result);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send({ message: 'Internal server error' });
    }
  });


  app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
    const id = req.params.id;
    const roll = req.body;
    const { role } = req.body;
    const filter= {_id : new ObjectId(id)}
    const updateDoc ={
      $set:{
        role :role
      }
    }
    const result = await usersCollection.updateOne(filter,updateDoc)
   res.send(result)
  })
  
 

 
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running ");
});

app.listen(port, () => {
  console.log(`Room is Counting ${port}`);
});
