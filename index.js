require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });


  const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: Number, required: true, unique: true }
  });
  const Url = mongoose.model('Url', urlSchema);



  const dns = require('dns');

 

  app.post('/api/shorturl', async (req, res) => {
    const originalUrl = req.body.url;
  
    try {
      // Validate the URL using dns.lookup
      dns.lookup(new URL(originalUrl).hostname, async (err) => {
        if (err) {
          console.error('Invalid URL:', err);
          return res.status(400).json({ error: 'Invalid URL' });
        }
    
        try {
          // Check if the URL already exists in the database
          let urlDoc = await Url.findOne({ originalUrl });
          if (urlDoc) {
            return res.json({ original_url: originalUrl, short_url: urlDoc.shortUrl });
          }
      
          // Create a new short URL
          const shortUrlCounter = await Url.countDocuments() + 1;
          urlDoc = new Url({ originalUrl, shortUrl: shortUrlCounter });
          await urlDoc.save();
      
          res.json({ original_url: originalUrl, short_url: urlDoc.shortUrl });
        } catch (err) {
          console.error('Error creating short URL:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
    } catch (err) {
      console.error('Invalid URL:', err);
      return res.status(400).json({ error: 'Invalid URL' });
    }
  });
  


 // GET endpoint to redirect to the original URL
 app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = parseInt(req.params.shortUrl);

  // Check if shortUrl is a valid number
  if (isNaN(shortUrl)) {
    return res.status(400).json({ error: 'Invalid short URL' });
  }

  try {
    console.log('Retrieving URL for short code:', shortUrl);
    const urlDoc = await Url.findOne({ shortUrl });
    console.log('Retrieved:', shortUrl, '->', urlDoc);

    if (urlDoc) {
      console.log('Redirecting to:', urlDoc.originalUrl);
      return res.redirect(urlDoc.originalUrl);
    } else {
      console.log('Short URL not found');
      return res.json({ error: 'Short URL not found' });
    }
  } catch (err) {
    console.error('Error retrieving short URL:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
