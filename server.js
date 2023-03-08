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
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fr1.departureDestination, fr1.arrivalDestination
      FROM FlightItineraries AS fi
      JOIN (
        SELECT fr1.route_id AS departureRouteId, fr2.route_id AS arrivalRouteId
        FROM FlightRoutes AS fr1
        JOIN FlightRoutes AS fr2 ON fr1.arrivalDestination = fr2.departureDestination
        WHERE fr1.departureDestination = ?
          AND fr2.arrivalDestination = ?
      ) AS routes ON fi.route_id = routes.departureRouteId OR fi.route_id = routes.arrivalRouteId
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
      
      SELECT fi.itinerary_flight_id, fi.departureAt, fi.arrivalAt, fi.availableSeats, fp.adult, fr.departureDestination, fr.arrivalDestination
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
      departureAt,
      seats,
      priceRangeHigh,
      priceRangeLow,
    ],
    (err, rows) => {
      if (!rows || rows.length === 0) {
        res.status(404).send("No flights found that meet your requirements");
      } else if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.send(rows);
      }
    }
  );
});

// Default response for any other request
app.use(function (req, res) {
  res.sendStatus(404);
});
