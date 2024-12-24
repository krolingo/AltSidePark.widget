const API_URL = "http://localhost:3000/api/altSideParking"; // Fetch from the local server

// Helper function to get the current date in uppercase "DEC" and "12" format, with the weekday
const getCurrentDate = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'long' });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find(part => part.type === 'weekday').value.toLowerCase(); // e.g., "saturday"
  const month = parts.find(part => part.type === 'month').value.toUpperCase();    // e.g., "DEC"
  const day = parts.find(part => part.type === 'day').value;                      // e.g., "14"

  return { weekday, month, day };
};

// Helper function to format the timestamp to "YYYYMMDD-HH:mm:ss"
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  // Get date parts (year, month, day)
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // "01" to "12"
  const day = date.getDate().toString().padStart(2, '0'); // "01" to "31"

  // Get time parts (hours, minutes, seconds)
  const hours = date.getHours().toString().padStart(2, '0'); // "00" to "23"
  const minutes = date.getMinutes().toString().padStart(2, '0'); // "00" to "59"
  const seconds = date.getSeconds().toString().padStart(2, '0'); // "00" to "59"

  // Return in "YYYYMMDD-HH:mm:ss" format
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
    const { weekday, month, day } = getCurrentDate();

    // Helper function to determine status based on the current day
    const getStatus = (item) => {
      if (item?.CalendarDetailStatus) {
        return {
          status: item.CalendarDetailStatus,
          message: item.CalendarDetailMessage || "No additional details.",
        };
      }

      switch (weekday) {
        case 'saturday':
          return {
            status: item?.SaturdayRecordName || "Unknown",
            message: item?.SaturdayContentFormat || "No information available.",
          };
        case 'sunday':
          return {
            status: item?.SundayRecordName || "Unknown",
            message: item?.SundayContentFormat || "No information available.",
          };
        default: // Weekday
          return {
            status: item?.WeekDayRecordName || "Unknown",
            message: item?.WeekDayContentFormat || "No information available.",
          };
      }
    };

    // Format the lastUpdated timestamp if available
    const timestamp = data.lastUpdated ? formatTimestamp(data.lastUpdated) : "ts:Unknown";

    return {
      altSideParking: {
        ...getStatus(altSideParking),
        icon: "AltSidePark.Widget/images/utility-icon-parking-fillcolor.svg", // Image for AltSide Parking
      },
      recycling: {
        ...getStatus(recycling),
        icon: "AltSidePark.Widget/images/utility-icon-sanitation-fillcolor.svg", // Image for Recycling
      },
      schools: {
        ...getStatus(schools),
        icon: "AltSidePark.Widget/images/utility-icon-school-fillcolor.svg", // Image for Schools
      },
      month,
      day,
      timestamp,
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
      <h2 className="widget-date">{output.month}</h2>
      <h3 className="widget-day">{output.day}</h3>

      <section className="status-section">
        <div className="status-left">
          <img src={output?.altSideParking?.icon || 'AltSidePark.Widget/images/utility-icon-parking-fillcolor.svg'} alt="Alternate Side Parking" className="status-icon" />
          <p className="status-label">
            <strong>Alternate Side Parking</strong>
          </p>
          <p className="status-text">{output?.altSideParking?.status || "Loading..."}</p>
        </div>
      </section>

      <section className="status-section">
        <div className="status-left">
          <img src={output.recycling?.icon} alt="Recycling" className="status-icon" />
          <p className="status-label">
            <strong>Collections</strong>
          </p>
          <p className="status-text">{output?.recycling?.status || "Loading..."}</p>
        </div>
      </section>

      <section className="status-section">
        <div className="status-left">
          <img src={output.schools?.icon} alt="Schools" className="status-icon" />
          <p className="status-label">
            <strong>Schools</strong>
          </p>
          <p className="status-text">{output?.schools?.status || "Loading..."}</p>
        </div>
      </section>

      <footer>
        <p className="timestamp">{output.timestamp}</p>
      </footer>
    </div>
  );
};

// CSS Styling (Narrow layout)
export const className = `
  .widget {
    position: absolute;
    top: 48px;
    left: 1250px;
    padding: 10px;
    font-family: 'SF Pro', Arial, sans-serif;
    font-size: 14px;
    color: white;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    width: 90px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .widget-title {
    font-family: 'SF Pro Display','Hack Nerd Font', 'Iosevka Term', 'SF Pro', Arial, sans-serif;
    font-size:16px;
    font-weight: 500;
    color: white;
    text-align: center;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .widget-date {
    font-family: 'SF Pro Display','Hack Nerd Font', 'Iosevka Term', 'SF Pro', Arial, sans-serif;
    font-size:14px;
    font-weight: 500;
    color: white;
    text-align: center;
    margin-top: -5px;
    margin-bottom: 0px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .widget-day {
    font-family: 'SF Pro Display','Hack Nerd Font', 'Iosevka Term', 'SF Pro', Arial, sans-serif;
    font-size:48px;
    font-weight: 300;
    color: white;
    text-align: center;
    margin-top: 1px;
    margin-bottom: -2px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .status-section {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    align-items: center;
  }

  .status-left {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .status-icon {
    width: 40px;
    height: auto;
    margin-bottom: 0px;
  }

  .status-label {
    font-family: 'SF Pro','Iosevka Term','SF Pro', Arial, sans-serif;
    font-weight: 100;
    font-size: 12px;
    text-align: center;
    margin-bottom: -5px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .status-text {
    font-family: 'SF Pro Display','Iosevka Term','SF Pro', Arial, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #FFFFFF;
    text-align: center;
    margin-bottom: 5px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  footer {
    margin-top: 5px;
    text-align: center;
    font-size: 10px;
    color: lightgray;
  }

.timestamp {
  font-family: 'Iosevka Term','SF Pro', Arial, sans-serif;
  font-size: 8px;
  color: grey;
  margin-bottom: 0;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
  display: inline; /* Keep the timestamp inline */
  white-space: nowrap; /* Prevent wrapping */
}

  .error {
    color: red;
    text-align: center;
  }
`;
