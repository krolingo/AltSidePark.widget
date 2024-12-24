const API_URL = "http://localhost:3000/api/altSideParking"; // Fetch from the local server

// Helper function to get the current date
const getCurrentDate = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'long' });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find(part => part.type === 'weekday').value.toLowerCase();
  const month = parts.find(part => part.type === 'month').value.toUpperCase();
  const day = parts.find(part => part.type === 'day').value;

  return { weekday, month, day };
};

// Format the timestamp to "YYYYMMDD-HH:mm:ss"
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}-${hours}:${minutes}:${seconds}`;
};

// Check server availability
const isServerAvailable = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

// Fetch and process data
export const command = async () => {
  let serverAvailable = await isServerAvailable(API_URL);

  // Retry until server is available
  while (!serverAvailable) {
    await new Promise(resolve => setTimeout(resolve, 15000));
    serverAvailable = await isServerAvailable(API_URL);
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    const altSideParking = data.results.find(item => item.CalendarName === "Alternate Side Parking");
    const recycling = data.results.find(item => item.CalendarName === "Collections");
    const schools = data.results.find(item => item.CalendarName === "Schools");
    const { weekday, month, day } = getCurrentDate();

    const getStatus = (item) => {
      if (item?.CalendarDetailStatus) {
        return {
          status: item.CalendarDetailStatus,
          message: item.CalendarDetailMessage || "No details available.",
        };
      }

      switch (weekday) {
        case 'saturday':
          return { status: item?.SaturdayRecordName || "Unknown", message: item?.SaturdayContentFormat || "No info available." };
        case 'sunday':
          return { status: item?.SundayRecordName || "Unknown", message: item?.SundayContentFormat || "No info available." };
        default:
          return { status: item?.WeekDayRecordName || "Unknown", message: item?.WeekDayContentFormat || "No info available." };
      }
    };

    const timestamp = data.lastUpdated ? formatTimestamp(data.lastUpdated) : "Unknown timestamp";

    return {
      altSideParking: { ...getStatus(altSideParking), icon: "AltSidePark.Widget/images/utility-icon-parking-fillcolor.svg" },
      recycling: { ...getStatus(recycling), icon: "AltSidePark.Widget/images/utility-icon-sanitation-fillcolor.svg" },
      schools: { ...getStatus(schools), icon: "AltSidePark.Widget/images/utility-icon-school-fillcolor.svg" },
      month,
      day,
      timestamp,
    };
  } catch (err) {
    return { error: `Error fetching data: ${err.message}` };
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
      <h1 className="widget-title">NYC Today 🗽 {output.month} {output.day}</h1>
      {['altSideParking', 'recycling', 'schools'].map((section) => (
        <section className="status-section" key={section}>
          <div className="status-left">
            <img src={output[section].icon} alt={section} className="status-icon" />
            <p className="status-label"><strong>{section.replace(/([A-Z])/g, ' $1')}</strong></p>
            <p className="status-text">{output[section].status}</p>
          </div>
          <div className="status-right">
            <p className="status-message">{output[section].message}</p>
          </div>
        </section>
      ))}
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
    left: 1010px;
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
