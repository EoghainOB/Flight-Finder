# Flight-Finder
This backend API enables flight search and booking and is made with Javascript, Express and SQLite. Using the endpoints listed below with the parameters shown the API a user can fine tune their flight search from the mock data and can also making a booking. 

## Express Endpoints
The following are the endpoints of the API:

## GET `/api/flightsearch`
This endpoint takes in the following parameters:

- `departureDestination` (string): Departure destination of the flight.
- `arrivalDestination` (string): Arrival destination of the flight.
- `departureAt` (string): Date and time of the departure in ISO format.
- `seats` (number): Number of seats required.
- `priceRangeHigh` (number): Maximum price range of the flights.
- `priceRangeLow` (number): Minimum price range of the flights.
And returns all flights that match the given parameters.

## POST `/api/booking`
This endpoint is used to book a flight, and takes in the following parameters:

- `itinerary_flight_id` (number): ID of the flight itinerary.
- `seats` (number): Number of seats required.
- `adult` (number): Number of adults.
- `child` (number): Number of children.
- `total` (number): Total price of the booking.
- `currency` (string): Currency of the booking.
And returns the booking details.

## Installation
- Clone the repository using `git clone`
- Install the dependencies using `npm install`
- Run the server using `npm start`
- Note: This API uses port 8080 by default.

## Technologies Used
<div>
    <img height=40 src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg"/>
    <img height=40 src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" />
    <img height=40 src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" />
    <img height=40 src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg"/>
</div>
