var express = require("express");
var cookieParser = require("cookie-parser")
var app = express();
app.use(express.json());
app.use(cookieParser());
const mongoose = require('mongoose')


var cors = require("cors");
const { response } = require("express");
app.use(cors({ optionsSuccessStatus: 200, origin: 'https://chatit.divu050704.repl.co', credentials: true }));  
app.use(express.static("public"));

const url = process.env['MONGO_URI']
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
mongoose.connect(url, connectionParams)
  .then(() => {
    console.log('Connected to the database ')
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  })


app.get("/", (req, res) => {
  res.sendFile("index.html", {root: __dirname })

})

const dataSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String
  },
  passwd: {
    required: true,
    type: String
  },
  SID: {
    type: String
  },
  chats: {
    type: Object
  }
})
const Model = mongoose.model("users", dataSchema)
app.post("/signup/", (req, res) => {
  const data = new Model({
    username: req.body.username,
    passwd: req.body.passwd,

  })
  Model.findOne({
    username: req.body.username
  }, function(err, object) {
    if (object === null) {
      try {
        const dataToSave = data.save();
        res.status(200).send({ Created: "OK" })
      }
      catch (error) {
        console.log(error)

      }
    }
    else {
      res.status(200).send({ Created: "No" })
    }
  })

})
app.get("/api/verify", (req, res) => {
  Model.findOne({
    username: req.cookies.uname,
    SID: req.cookies.SID
  }, function(err, object) {
    if (object !== null) {
      res.status(200).json({ checked: true })
    }
    else {
      res.status(200).json({ checked: false })
    }
  })
})
app.use(cookieParser());
app.post("/api/auth/login/", (req, res) => {
  Model.findOne({
    username: req.body.username,
    passwd: req.body.passwd
  }, function(err, object) {
    if (object !== null) {
      const rand = () => {
        return Math.random().toString(36).substr(2);
      };

      const token = () => {
        return rand() + rand();
      };
      const id = token()

      Model.updateOne({ username: req.body.username }, { $set: { SID: id } }, function(err, res1) {

        res.cookie("SID", id, { maxAge: 1000 * 60 * 60 * 24 * 30,secure: process.env.NODE_ENV === "development" ? false : true })
        res.cookie("uname", req.body.username, { maxAge: 1000 * 60 * 60 * 24 * 30 ,secure: process.env.NODE_ENV === "development" ? false : true})
        res.status(200).json(object)
        
      })
    }
    else {
      res.status(200).json(object)
    }
  })
})

app.get("/api/auth/logout/", (req, res) => {
  res.clearCookie("SID")
  res.clearCookie("uname")
  res.send("logged out")
})

app.post("/api/chats/", (req, res) => {
  Model.findOne({
    username: req.body.username
  }, function(err, object) {
    if (object !== null) {
      if (object.chats) {
        res.send(object.chats)
      }
      else {
        res.json({})
      }
    }
  })
})
app.post("/api/send", (req, res, next) => {
  const sender = `chats.${req.body.r}`;
  const reciever = `chats.${req.body.s}`;

  Model.updateOne({ username: req.body.s }, { $push: { [sender]: { "s": req.body.message } } }, function(err, res1) {

  })
  Model.updateOne({ username: req.body.r }, { $push: { [reciever]: { "r": req.body.message } } }, function(err, res2) {
  })
  next()

})
app.get("/api/users", (req, res, next) => {

  Model.find({}, 'username -_id', function(err, object) {
    res.json(object)
  })

})



// listen for requests :) 
var listener = app.listen(8080, function() {
  console.log("Your app is listening on port " + listener.address().port);
});