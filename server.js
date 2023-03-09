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

//Flights endpoints

app.get("/api/flights", (req, res, next) => {
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
  const departureDestination = req.body.departureDestination;
  const arrivalDestination = req.body.arrivalDestination;
  const departureAt = new Date(req.body.departureAt).toISOString();
  const seats = req.body.seats;
  const priceRangeHigh = req.body.priceRangeHigh;
  const priceRangeLow = req.body.priceRangeLow;

  const query = `
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fp.child, fp.currency, fr1.departureDestination, fr1.arrivalDestination
      FROM FlightItineraries AS fi
      JOIN (
        SELECT fr1.route_id AS departureRouteId, fr2.route_id AS arrivalRouteId
        FROM FlightRoutes AS fr1
        JOIN FlightRoutes AS fr2 ON fr1.arrivalDestination = fr2.departureDestination
        WHERE fr1.departureDestination = ?
        AND fr2.arrivalDestination = ?
        ) AS routes ON fi.route_id = routes.departureRouteId
        JOIN FlightRoutes AS fr1 ON fi.route_id = fr1.route_id
        JOIN FlightPrices AS fp ON fi.itinerary_flight_id = fp.itinerary_flight_id
        WHERE (
        (fr1.departureDestination = ? OR fr1.arrivalDestination = ?)
        AND DATE(fi.departureAt) = DATE(?)
        AND fi.availableSeats >= ?
        AND fp.adult <= ?
        AND fp.adult >= ?
      )
      
      UNION ALL
      
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fp.child, fp.currency, fr2.departureDestination, fr2.arrivalDestination
      FROM FlightItineraries AS fi
      JOIN (
        SELECT fr1.route_id AS departureRouteId, fr2.route_id AS arrivalRouteId
        FROM FlightRoutes AS fr1
        JOIN FlightRoutes AS fr2 ON fr1.arrivalDestination = fr2.departureDestination
        WHERE fr1.departureDestination = ?
        AND fr2.arrivalDestination = ?
        ) AS routes ON fi.route_id = routes.arrivalRouteId
        JOIN FlightRoutes AS fr2 ON fi.route_id = fr2.route_id
        JOIN FlightPrices AS fp ON fi.itinerary_flight_id = fp.itinerary_flight_id
        WHERE (
        (fr2.departureDestination = ? OR fr2.arrivalDestination = ?)
        AND DATE(fi.departureAt) = DATE(?)
        AND fi.availableSeats >= ?
        AND fp.adult <= ?
        AND fp.adult >= ?
      )
      
      UNION ALL
      
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fp.child, fp.currency, fr.departureDestination, fr.arrivalDestination
      FROM FlightItineraries AS fi
      JOIN FlightRoutes AS fr ON fi.route_id = fr.route_id
      JOIN FlightPrices AS fp ON fi.itinerary_flight_id = fp.itinerary_flight_id
      WHERE fr.departureDestination = ? 
      AND fr.arrivalDestination = ?
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
      arrivalDestination,
      departureDestination,
      arrivalDestination,
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
      departureDestination,
      arrivalDestination,
      departureDestination,
      arrivalDestination,
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
      departureDestination,
      arrivalDestination,
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
    ],
    (err, rows) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.send(rows);
      }
    }
  );
});

app.post("/api/booking", async (req, res, next) => {
  try {
    const booking = {
      itinerary_flight_id: req.body.itinerary_flight_id,
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
      const sql2 =
        "SELECT availableSeats FROM FlightItineraries WHERE itinerary_flight_id = ?";
      db.get(sql2, [booking.itinerary_flight_id], (err, row) => {
        if (err) {
          res.status(500).send({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).send({ error: "flight itinerary not found" });
          return;
        }
        const availableSeats = row.availableSeats - booking.seats;
        const sql3 =
          "UPDATE FlightItineraries SET availableSeats = ? WHERE itinerary_flight_id = ?";
        db.run(
          sql3,
          [availableSeats, booking.itinerary_flight_id],
          function (err) {
            if (err) {
              res.status(500).send({ error: err.message });
              return;
            }
            res.send({
              message: "success",
              booking_id: this.lastID,
            });
          }
        );
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

// Default response for any other request
app.use(function (req, res) {
  res.sendStatus(404);
});
