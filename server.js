const express = require('express');
const cors = require('cors');
const app = express();
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Pool = require('pg').Pool
const http = require('http').createServer(app);
const jwt = require('jsonwebtoken');


app.use(express.json())
app.use(cors())

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'realtimechat',
  password: '996653255',
  port: 5432,
})


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })



AWS.config.update({
  accessKeyId: 'AKIAVWCH3EBANZZDJO6L',
  secretAccessKey: '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',
  region: 'ap-south-1'
});

const s3 = new AWS.S3();
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "*"
  }
});



socketIO.on('connection', (socket) => {
  socket.on('joinRoom', (data) => {
    console.log("joinRoom event :", data)
    socket.broadcast.emit('userJoined', `${data.name} joined`);
  });
  socket.on('message', (data) => {
    console.log("message event :", data)
    socket.broadcast.emit('newMessage', data);
  });
  socket.on('disconnect', () => {
    console.log("disconnect event :")

  });

});



app.delete("/delete-account", (req, res) => {
  try {


    const query = 'DELETE FROM users WHERE user_id = $1';
    const values = [req.body.user_id]
    pool.query(query, values, (error, results) => {
      if (error) {
        throw error
      }
    })
    res.json({
      msg: "OK"
    })

  } catch (error) {
    res.json({
      msg: err.message
    })
  }
})

app.post("/change-password", (req, res) => {
  try {
    const query = `UPDATE users SET password = $1 WHERE user_id = $2`
    console.log(req.body.password, req.body.user_id)
    const values = [req.body.password, req.body.user_id]
    pool.query(query, values, (error, results) => {
      if (error) {
        throw error
      }
      console.log("reslt :", results.rows)
    })
    res.json({
      msg: "OK"
    })
  }
  catch (err) {
    console.log("ERROR ::::")
    res.json({
      msg: err.message
    })
  }
})
app.get("/users", (req, res) => {
  const query = 'SELECT * FROM users';

  pool.query(query, (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })

})


app.post('/register', upload.single('file'), (req, res) => {

  const params = {
    Bucket: 'user-dps',
    Key: req.file.originalname,
    Body: fs.readFileSync(`uploads/${req.file.originalname}`)
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error uploading image to S3');
    } else {
      console.log(`Image uploaded to S3: ${data.Location}`);

      const query = 'INSERT INTO users(firstname , lastname , email , password , status , profile , key ) VALUES($1 , $2 , $3 , $4 , $5 , $6 , $7) RETURNING *';
      const values = [req.body.firstname, req.body.lastname, req.body.email, req.body.password, "sample-status-for-now", data.Location, req.file.originalname]
      pool.query(query, values, (error, results) => {
        if (error) {
          throw error
        }
        let email = req.body.email
        let expiresIn = "12h"
        const token = jwt.sign({ email }, 'your_secret_key_here', { expiresIn });

      })
      fs.unlinkSync(`uploads/${req.file.originalname}`)

      res.status(200).send('Image uploaded successfully');
    }
  });

})


app.listen(5000, () => {
  console.log("server is running on port 5000")

})


http.listen(8000, () => {
  console.log(`Server running on port 8000`);
});




// things to do in this
// 1. good home screen
// 2. in left side all users name should be there.
// 3. when a user jiongs , all the other users should get a message saying  "user joined a room"
// 4. leave a room.
// 5. good design for chatwindows page