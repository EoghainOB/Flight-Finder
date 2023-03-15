import express from "express";
import cors from "cors";
import db from "./Database/database.js";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

app.listen(8080, () => {
  console.log("Server running on port %PORT%".replace("%PORT%", 8080));
});

app.get("/api/flights", (req, res) => {
  const sql = "select * from FlightRoutes";
  const params = [];
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: "success",
      data: rows,
    });
  });
});

app.get("/api/flightsearch", (req, res) => {
  const departureDestination = req.query.departureDestination;
  const arrivalDestination = req.query.arrivalDestination;
  const departureAt = new Date(req.query.departureAt).toISOString();
  const seats = req.query.seats;
  const priceRangeHigh = req.query.priceRangeHigh;
  const priceRangeLow = req.query.priceRangeLow;

  const query = `      
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fp.child, fp.currency, fr.departureDestination, fr.arrivalDestination
      FROM FlightItineraries AS fi
      JOIN FlightRoutes AS fr ON fi.route_id = fr.route_id
      JOIN FlightPrices AS fp ON fi.itinerary_flight_id = fp.itinerary_flight_id
      WHERE fr.departureDestination = ? 
      AND DATE(fi.departureAt) = DATE(?)
      AND fi.availableSeats >= ?
      AND fp.adult <= ?
      AND fp.adult >= ?
      OR fr.arrivalDestination = ?
      AND DATE(fi.departureAt) = DATE(?)
      AND fi.availableSeats >= ?
      AND fp.adult <= ?
      AND fp.adult >= ?

      ORDER BY departureAt
  `;

  db.all(
    query,
    [
      departureDestination,
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
      arrivalDestination,
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
    ],
    (err, rows) => {
      if (err) {
        res.status(500).send({ error: err.message });
        return;
      }
      const flights = rows;

      const directFlights = flights.filter(
        (flight) =>
          flight.departureDestination === departureDestination &&
          flight.arrivalDestination === arrivalDestination
      );

      const indirectFlights = flights.filter(
        (flight) => !directFlights.includes(flight)
      );

      const groupedDirectFlights = directFlights.reduce(
        (result, currentFlight) => {
          const existingGroup = result.find(
            (group) =>
              group.itinerary_flight_id === currentFlight.itinerary_flight_id
          );
          if (existingGroup) {
            existingGroup.outbound = currentFlight;
          } else {
            result.push({
              id: currentFlight.itinerary_flight_id,
              currentFlight,
            });
          }
          return result;
        },
        []
      );

      const outboundIndirect = indirectFlights.filter((flight) => {
        return flight.departureDestination === departureDestination;
      });

      const inboundIndirect = indirectFlights.filter((flight) => {
        return flight.arrivalDestination === arrivalDestination;
      });

      const groupedIndirectFlights = [];

      outboundIndirect.forEach((outboundFlight) => {
        inboundIndirect.forEach((inboundFlight) => {
          if (
            outboundFlight.arrivalDestination ===
              inboundFlight.departureDestination &&
            new Date(inboundFlight.departureAt) >
              new Date(outboundFlight.arrivalAt)
          ) {
            groupedIndirectFlights.push({
              id: `${outboundFlight.itinerary_flight_id}.${inboundFlight.itinerary_flight_id}`,
              adultIndirect: +outboundFlight.adult + +inboundFlight.adult,
              childIndirect: +outboundFlight.child + +inboundFlight.child,
              departureAtIndirect: outboundFlight.departureAt,
              arrivalAtIndirect: inboundFlight.arrivalAt,
              departureDestinationIndirect: outboundFlight.departureDestination,
              arrivalDestinationIndirect: outboundFlight.arrivalDestination,
              outboundFlight,
              inboundFlight,
            });
          }
        });
      });

      res.json({
        message: "success",
        data: {
          direct: groupedDirectFlights,
          indirect: groupedIndirectFlights,
        },
      });
    }
  );
});

app.post("/api/booking", (req, res) => {
  const itinerary_flight_id = req.body.itinerary_flight_id;
  const seats = req.body.seats;

  const itinerary_flight_ids = itinerary_flight_id.split(".");
  let sql;
  let values;

  if (itinerary_flight_ids.length === 1) {
    sql =
      "UPDATE FlightItineraries SET availableSeats = availableSeats - ? WHERE itinerary_flight_id = ?";
    values = [seats, itinerary_flight_id];
  } else {
    sql =
      "UPDATE FlightItineraries SET availableSeats = availableSeats - ? WHERE itinerary_flight_id IN (?, ?)";
    values = [seats, itinerary_flight_ids[0], itinerary_flight_ids[1]];
  }

  db.run(sql, values, function (err) {
    if (err) {
      res.status(500).send({ error: err.message });
      return;
    }

    const booking = {
      itinerary_flight_id,
      seats: req.body.seats,
      adult: req.body.adult,
      child: req.body.child,
      total: req.body.total,
      currency: req.body.currency,
    };
    const sql =
      "INSERT INTO Bookings (itinerary_flight_id, seats, adult, child, total, currency) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [
      booking.itinerary_flight_id,
      booking.seats,
      booking.adult,
      booking.child,
      booking.total,
      booking.currency,
    ];
    db.run(sql, values, function (err) {
      if (err) {
        res.status(500).send({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: booking,
        id: this.lastID,
      });
    });
  });
});

app.use(function (req, res) {
  res.sendStatus(404);
});
