const express = require('express');
const cors = require('cors');
const app = express();
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const http = require('http').createServer(app);


app.use(express.json())
app.use(cors())


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



app.post('/register', upload.single('file'), (req, res) => { 
  const email = req.body.email;
  const lastname = req.body.lastname;
  const firstname = req.body.firstname;
  const status = req.body.status;
  const password = req.body.password;
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
      
      fs.unlinkSync(`uploads/${req.file.originalname}`)
      res.status(200).send('Image uploaded successfully');
    }
  });
  // console.log("/register")
  // const email = req.body.email;
  // const lastname = req.body.lastname;
  // const firstname = req.body.firstname;
  // const status = req.body.status;
  // const password = req.body.password;
  // res.json({
  //   msg:"OK" ,
  //   data : {
  //     email , lastname , firstname , status , password
  //   }
  // })
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