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

  // Regular expression to match valid URLs with http/https protocol
  const urlRegex = /^(https?):\/\/(\w+\.)+\w+\/?(\S*)$/;
  
  // POST endpoint to create short URLs
  app.post('/api/shorturl', async (req, res) => {
    const originalUrl = req.body.url;
  
    // Check if the URL matches the valid format
    if (!urlRegex.test(originalUrl)) {
      return res.status(400).json({ error: 'invalid url' });
    }
  
    try {
      // Prepend the URL with a default protocol if it's missing
      const formattedUrl = originalUrl.startsWith('http') ? originalUrl : `http://${originalUrl}`;
  
      // Validate the URL using dns.lookup
      dns.lookup(new URL(formattedUrl).hostname, async (err) => {
        if (err) {
          console.error('Invalid URL:', err);
          return res.status(400).json({ error: 'invalid url' });
        }
  
        // Check if the URL already exists in the database
        let urlDoc = await Url.findOne({ originalUrl: formattedUrl });
        if (urlDoc) {
          return res.json({ original_url: formattedUrl, short_url: urlDoc.shortUrl });
        }
  
        // Create a new short URL
        const shortUrlCounter = await Url.countDocuments() + 1;
        urlDoc = new Url({ originalUrl: formattedUrl, shortUrl: shortUrlCounter });
        await urlDoc.save();
  
        res.json({ original_url: formattedUrl, short_url: urlDoc.shortUrl });
      });
    } catch (error) {
      console.error('Error parsing URL:', error);
      res.status(400).json({ error: 'invalid url' });
    }
  });
  
  
  
  // GET endpoint to redirect to the original URL
  app.get('/api/shorturl/:shortUrl', async (req, res) => {
    const shortUrl = parseInt(req.params.shortUrl);
  
    try {
      const urlDoc = await Url.findOne({ shortUrl });
      if (urlDoc) {
        return res.redirect(urlDoc.originalUrl);
      } else {
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
