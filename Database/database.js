import pkg from "sqlite3";
const { verbose } = pkg;
import fs from "fs";
const sqlite3 = verbose();
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
    const flights = GetFlightsAsJson();
    db.run(
      `CREATE TABLE FlightRoutes (
        route_id TEXT PRIMARY KEY,
        departureDestination TEXT,
        arrivalDestination TEXT
      );`,
      (err) => {
        if (err) {
          console.log("FlightRoutes table already exists.");
        } else {
          const insert =
            "INSERT INTO FlightRoutes (route_id, departureDestination, arrivalDestination) VALUES (?,?,?)";
          flights.map((flight) => {
            db.run(insert, [
              flight.route_id,
              flight.departureDestination,
              flight.arrivalDestination,
            ]);
          });
          console.log(`${flights.length} FlightRoutes created.`);
        }
      }
    );
    db.run(
      `CREATE TABLE FlightItineraries (
        itinerary_id INTEGER PRIMARY KEY,
        route_id TEXT,
        itinerary_flight_id VARCHAR(50),
        departureAt VARCHAR(50),
        arrivalAt VARCHAR(50),
        availableSeats INT,
        FOREIGN KEY (route_id) REFERENCES FlightRoutes(route_id)
      );`,
      (err) => {
        if (err) {
          console.log("FlightItineraries table already exists.");
        } else {
          const insert =
            "INSERT INTO FlightItineraries (itinerary_id, route_id, itinerary_flight_id, departureAt, arrivalAt, availableSeats) VALUES (?,?,?,?,?,?)";
          flights.map((flight) => {
            flight.itineraries.map((itinerary) => {
              db.run(insert, [
                itinerary.itinerary_id,
                flight.route_id,
                itinerary.flight_id,
                itinerary.departureAt,
                itinerary.arrivalAt,
                itinerary.availableSeats,
              ]);
            });
          });
          console.log(`${flights.length} FlightItineraries created.`);
        }
      }
    );
    db.run(
      `CREATE TABLE FlightPrices(
        prices_id INTEGER PRIMARY KEY,
        itinerary_flight_id VARCHAR(50),
        currency TEXT,
        adult INT,
        child INT,
        FOREIGN KEY (itinerary_flight_id) REFERENCES FlightItineraries(itinerary_flight_id)
      );`,
      (err) => {
        if (err) {
          // Table already created
          console.log("Already FlightPrices table there");
        } else {
          const insert =
            "INSERT INTO FlightPrices (prices_id, itinerary_flight_id, currency, adult, child) VALUES (?,?,?,?,?)";
          flights.map((flight) => {
            flight.itineraries.map((itinerary) => {
              db.run(insert, [
                itinerary.prices.prices_id,
                itinerary.flight_id,
                itinerary.prices.currency,
                itinerary.prices.adult,
                itinerary.prices.child,
              ]);
            });
          });
          console.log(`FlightPrices created`);
        }
      }
    );
    db.run(
      `CREATE TABLE Bookings(
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_flight_id VARCHAR(50),
        seats INT,
        adult INT,
        child INT,
        total INT,
        currency VARCHAR(50)
      );`,
      (err) => {
        if (err) {
          // Table already created
          console.log("Already Bookings table there");
        } else {
          db.run(
            `INSERT INTO Bookings (itinerary_flight_id, seats, adult, child, total, currency) VALUES (?,?,?,?,?,?)`,
            ["", 0, 0, 0, 0, ""],
            (err) => {
              if (err) {
                console.log("Error inserting empty booking row:", err.message);
              } else {
                console.log("Empty booking row inserted successfully.");
              }
            }
          );
        }
      }
    );
  }
});

function GetFlightsAsJson() {
  const flights = JSON.parse(
    fs.readFileSync("./Database/mockData/flightData.json")
  );
  const uniqueFlights = flights.reduce((acc, flight) => {
    if (!acc[flight.route_id]) {
      acc[flight.route_id] = flight;
    } else {
      acc[flight.route_id].itineraries.push(...flight.itineraries);
    }
    return acc;
  }, {});
  return Object.values(uniqueFlights);
}

export default db;
