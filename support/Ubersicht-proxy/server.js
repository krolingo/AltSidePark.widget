const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

// Enable CORS for all origins (or limit to your widget's origin)
app.use(cors({
  origin: 'http://127.0.0.1:41416', // Allow only your widget's origin
  methods: 'GET, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
}));

// Function to get the current date in 'YYYY-MM-DD' format
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Function to fetch data from the NYC 311 API and save it to a file
const fetchAndSaveData = async () => {
  try {
    const today = getCurrentDate(); // Get today's date dynamically
    console.log(`Fetching data for date: ${today}`);
  
    // Make a request to the NYC 311 API with the dynamic date
    const response = await axios.get(`https://portal.311.nyc.gov/home-cal/?today=${today}`);
  
    // Save the response data to a file
    fs.writeFileSync('altSideParkingData.json', JSON.stringify(response.data, null, 2));
    console.log('Data saved to altSideParkingData.json');
  } catch (error) {
    console.error('Error fetching data from NYC 311 API:', error);
  }
};

// Schedule the fetch to run once a day (every 24 hours)
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled data fetch...');
  fetchAndSaveData();
});

// Route to manually fetch and update the data
app.get('/api/updateAltSideParking', async (req, res) => {
  try {
    const today = getCurrentDate(); // Get today's date dynamically
    console.log(`Manually fetching data for date: ${today}`);
  
    // Make a request to the NYC 311 API with the dynamic date
    const response = await axios.get(`https://portal.311.nyc.gov/home-cal/?today=${today}`);
  
    // Save the response data to a file
    fs.writeFileSync('altSideParkingData.json', JSON.stringify(response.data, null, 2));
    console.log('Data manually saved to altSideParkingData.json');
    res.json({ message: 'Data manually updated successfully' });
  } catch (error) {
    console.error('Error fetching data from NYC 311 API:', error);
    res.status(500).json({ error: 'Error fetching data from NYC 311 API' });
  }
});

// Serve the static JSON file for altSideParking
app.get('/api/altSideParking', (req, res) => {
  // Read the static JSON file
  fs.readFile('altSideParkingData.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Unable to read data from static file' });
    } else {
      res.json(JSON.parse(data)); // Send the data to the widget
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  // Initial fetch when the server starts (just in case you want it to start immediately)
  fetchAndSaveData();
});
