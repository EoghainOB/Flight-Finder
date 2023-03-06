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

app.get("/", (req, res, next) => {
  res.json({ message: "Ok" });
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

  const query = `SELECT *
                FROM FlightItineraries AS fi
                JOIN FlightRoutes AS fr ON fi.route_id = fr.route_id
                WHERE fr.departureDestination = ? 
                AND fr.arrivalDestination = ?
                AND DATE(fi.departureAt) = DATE(?)
                AND fi.availableSeats >= ?`;

  db.all(
    query,
    [departureDestination, arrivalDestination, departureAt, seats],
    (err, rows) => {
      if (err) {
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
