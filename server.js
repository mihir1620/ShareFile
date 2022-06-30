require("dotenv").config()
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const File = require("./models/File");
const req = require("express/lib/request");

const app = express();
app.use(express.urlencoded({ extended: true }))
const uploadFile = multer({dest : 'sharedFile'});

const connectDB = async() => {
  try{
      const conn = await mongoose.connect(process.env.DATABASE_URL , {
          useNewUrlParser : true,
          useUnifiedTopology : true
      });
      console.log(`MongoDB connected on ${conn.connection.host}`);
  }
  catch(error)
  {
      console.log(error);
      process.exit(1);
  }

}
connectDB();

app.set('view engine' , 'ejs')

app.get('/' , (req,res) => {
    res.render('index');
})

app.post('/upload' , uploadFile.single('file') , async (req,res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
      }
      if (req.body.pswd != null && req.body.pswd !== "") {
        fileData.password = await bcrypt.hash(req.body.pswd, 10)
      }
    
      const file = await File.create(fileData)
    
      res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
    })


app.route("/file/:id").get(handleDownload).post(handleDownload)

  async function handleDownload(req, res) {
      const file = await File.findById(req.params.id)
      
      if (file.password != null) {
        if (req.body.password == null) {
          res.render("password")
          return
        }
    
        if (!(await bcrypt.compare(req.body.password, file.password))) {
          res.render("password", { error: true })
          return
        }
      }
    
      file.downloadCount++
      await file.save()
    
      res.download(file.path, file.originalName)
  }

app.listen(process.env.PORT , ()=>{
  console.log(`Server running on port no ${process.env.PORT}`);
})