const API_URL = "http://localhost:3000/api/altSideParking"; // Fetch from the local server

// Helper function to get the current date in "MMM DD, YYYY" format
const getCurrentDate = () => {
  const now = new Date();
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return now.toLocaleDateString('en-US', options);
};

// Helper function to format the timestamp from the data source
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // Format to "MM/DD/YYYY HH:mm:ss"
};

// Check server availability // Wait to load widget until server is running!
const isServerAvailable = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

// Command to fetch data
export const command = async () => {
  let serverAvailable = await isServerAvailable(API_URL);

  // Wait until server is available
  while (!serverAvailable) {
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds
    serverAvailable = await isServerAvailable(API_URL); // Check again
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Extract relevant calendar data
    const altSideParking = data.results.find(
      (item) => item.CalendarName === "Alternate Side Parking"
    );
    const recycling = data.results.find(
      (item) => item.CalendarName === "Collections"
    );
    const schools = data.results.find(
      (item) => item.CalendarName === "Schools"
    );

    // Get current date
    const dateCollected = getCurrentDate();

    // Function to determine status and message correctly
    const getStatus = (item) => {
      if (item?.CalendarDetailStatus && item.CalendarDetailStatus !== "IN EFFECT") {
        return {
          status: item.CalendarDetailStatus.toUpperCase(), // Shows "SUSPENDED" if applicable
          message: item.CalendarDetailMessage || "Check NYC 311 for details.",
        };
      }
      return {
        status: item?.WeekDayRecordName || "Unknown",
        message: item?.WeekDayContentFormat || "No information available.",
      };
    };

    return {
      altSideParking: {
        ...getStatus(altSideParking),
        icon: "AltSidePark.Widget/images/utility-icon-parking-fillcolor.svg",
      },
      recycling: {
        ...getStatus(recycling),
        icon: "AltSidePark.Widget/images/utility-icon-sanitation-fillcolor.svg",
      },
      schools: {
        ...getStatus(schools),
        icon: "AltSidePark.Widget/images/utility-icon-school-fillcolor.svg",
      },
      dateCollected,
      timestamp: data.lastUpdated ? formatTimestamp(data.lastUpdated) : "Unknown",
    };
  } catch (err) {
    return {
      error: `Error fetching data: ${err.message}`,
    };
  }
};

// Render the widget
export const render = ({ output }) => {
  if (output?.error) {
    return (
      <div className="widget">
        <p className="error">{output.error}</p>
      </div>
    );
  }

  return (
    <div className="widget">
      <h1 className="widget-title">NYC Today 🗽 {output.dateCollected} </h1>

      {/* Alternate Side Parking Section */}
      <section className="status-section">
        <div className="status-left">
          <img src={output?.altSideParking?.icon} alt="Alternate Side Parking" className="status-icon" />
          <p className="status-label"><strong>Alternate Side Parking</strong></p>
          <p className="status-text">{output?.altSideParking?.status || "Loading..."}</p>
        </div>
        <div className="status-right">
          <p className="status-message">{output?.altSideParking?.message || "Fetching data..."}</p>
        </div>
      </section>

      {/* Collections Section */}
      <section className="status-section">
        <div className="status-left">
          <img src={output.recycling?.icon} alt="Recycling" className="status-icon" />
          <p className="status-label"><strong>Collections</strong></p>
          <p className="status-text">{output?.recycling?.status || "Loading..."}</p>
        </div>
        <div className="status-right">
          <p className="status-message">{output?.recycling?.message || "Fetching data..."}</p>
        </div>
      </section>

      {/* Schools Section */}
      <section className="status-section">
        <div className="status-left">
          <img src={output?.schools?.icon} alt="Schools" className="status-icon" />
          <p className="status-label"><strong>Schools</strong></p>
          <p className="status-text">{output?.schools?.status || "Loading..."}</p>
        </div>
        <div className="status-right">
          <p className="status-message">{output?.schools?.message || "Fetching data..."}</p>
        </div>
      </section>

      <footer>
        <p className="timestamp">Last updated: {output.timestamp}</p>
      </footer>
    </div>
  );
};

// CSS Styling
export const className = `
  .widget {
    position: absolute;
    top: 40px;
    left: 1165px;
    padding: 20px;
    font-family: 'SF Pro', Arial, sans-serif;
    font-size: 16px;
    color: white;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    width: 220px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .widget-title {
    font-family: 'SF Pro Display','Hack Nerd Font', 'Iosevka Term', 'SF Pro', Arial, sans-serif;
    font-size:16px;
    font-weight: 500;
    margin-top: -10px;
    margin-bottom: 12px;
    color: white;
    text-align: center;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .status-section {
    display: flex;
    margin-bottom: 15px;
  }

  .status-left {
    flex: 0 0 100px;
    display: flex;
    flex-direction: column;
    margin-right: 0px;
    margin-left:  0px;
    align-items: center;
  }

  .status-icon {
    width: 50px;
    height: auto;
    margin-left: -15px;
    margin-bottom: -5px;
  }

  .status-label {
    font-family: 'SF Pro','Iosevka Term','SF Pro', Arial, sans-serif;
    font-weight: 100;
    font-size: 12px;
    text-align: center;
    margin-bottom: -5px;
    margin-left: -15px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .status-text {
    font-family: 'SF Pro Display','Iosevka Term','SF Pro', Arial, sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #FFFFFF;
    text-align: center;
    margin-bottom: 5px;
    margin-left: -15px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .status-right {
    flex: 1;
    margin-left: -10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .status-message {
    font-family: 'Iosevka Term','SF Pro', Arial, sans-serif;
    font-size: 12px;
    text-align: left;
    font-style: normal;
    margin-top:  0px;
    margin-left: 10px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);    
  }

  .error {
    color: red;
    text-align: center;
  }

  footer {
    margin-top: 5px;
    text-align: center;
    font-size: 12px;
    color: lightgray;
  }

  .timestamp {
    font-family: 'Iosevka Term','SF Pro', Arial, sans-serif;
    font-size: 10px;
    color: grey;
    margin-bottom: -15px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);    
  }
`;
