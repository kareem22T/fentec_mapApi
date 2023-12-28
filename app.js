// use express js
const express = require("express");
const app = express()
app.use(express.json())

// Autheinticate apis
// const apiAuth = require("./middleware/apiKeyAuth")
// app.use(apiAuth)

// use map api
const googleDistance = require('google-distance-matrix');
const apiKey = 'AIzaSyD92ePxBG5Jk6mM3djSW49zs3dRKJroWRk';

const NodeGeocoder = require('node-geocoder');
const options = {
    provider: 'google',
    apiKey: apiKey,
    formatter: null,
};
const geocoder = NodeGeocoder(options);

//use mysql
var mysql = require('mysql');
//connect to database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "fentec"
});
// ------------------------------------------------------------------------

// get scooters ---------------
app.get("/scooters", (request, response) => {
    con.connect(function (err) {
        con.query("SELECT * FROM scooters", function (err, result, fields) {
            if (result && result.length > 0)
                response.status(200).send(
                    {
                        "status": true,
                        "account_status": true,
                        "message": "successfuly operation",
                        "errors": [],
                        "data": result
                    }
                );
            else if (result && result.length == 0)
                response.status(404).send(
                    {
                        "status": false,
                        "account_status": true,
                        "message": "No scooters founded",
                        "errors": ['There is no any scooter'],
                        "data": []
                    }
                );
            else
                response.status(500).send(
                    {
                        "status": false,
                        "account_status": true,
                        "message": "Could not fetch scooters",
                        "errors": ['Server error could not fetch scooters'],
                        "data": []
                    }
                );
        });
    });
});
// ----------------------------

//get nearst scooter ----------
app.get("/nearest-scooter", (req, response) => {
    // Specify the origins and destinations coordinates
    let origins = []
    let destinations = []

    async function getAddressFromLatLng(lat, lng) {
        origins.push((await geocoder.reverse({ lat: lat, lon: lng }))[0].formattedAddress)

        con.connect(function (err) {
            // if (err) throw err;
            con.query("SELECT * FROM scooters", async function (err, result, fields) {
                if (result && result.length > 0) {
                    for await (const scooter of result) {
                        const iot = scooter;
                        destinations.push((await geocoder.reverse({ lat: iot.latitude, lon: iot.longitude }))[0].formattedAddress);
                    }
                    googleDistance.key(apiKey);
                    googleDistance.units('metric');

                    // Call the matrix method to calculate the distance
                    googleDistance.matrix(origins, destinations, (err, distances) => {
                        if (err) {
                            console.log('error: ', err);
                            return;
                        }

                        if (distances.status == 'OK') {
                            let nearest_distance_b_user_scooter;
                            let nearest_distance_b_user_scooter_km;
                            let distanceIndex = 0;
                            let i = 0;
                            for (const distance of distances.rows[0].elements) {
                                const dis = distance.distance.value;
                                const km = distance.distance.text;
                                if (i == 0) {
                                    nearest_distance_b_user_scooter = dis
                                    nearest_distance_b_user_scooter_km = km
                                } else {
                                    if (dis < nearest_distance_b_user_scooter) {
                                        nearest_distance_b_user_scooter = dis
                                        nearest_distance_b_user_scooter_km = km
                                        distanceIndex = i
                                    }
                                }

                                i++
                            }

                            if (nearest_distance_b_user_scooter > 3000) {
                                response.status(200).send(
                                    {
                                        "status": true,
                                        "account_status": true,
                                        "message": `There are no nearest scooters to your location the nearest one is about ${nearest_distance_b_user_scooter_km}`,
                                        "errors": [],
                                        "data": {
                                            "scooter": result[distanceIndex]
                                        }
                                    }
                                );

                            } else {
                                response.status(200).send(
                                    {
                                        "status": true,
                                        "account_status": true,
                                        "message": `The nearest scooters to your location is about ${nearest_distance_b_user_scooter_km}`,
                                        "errors": [],
                                        "data": {
                                            "scooter": result[distanceIndex]
                                        }
                                    }
                                );

                            }
                        } else {
                            console.log('error: ', distances.status);
                        }
                    })

                } else if (result && result.length == 0)
                    response.status(404).send(
                        {
                            "status": false,
                            "account_status": true,
                            "message": "No scooters founded",
                            "errors": ['There is no any scooter'],
                            "data": []
                        }
                    );
                else
                    response.status(500).send(
                        {
                            "status": false,
                            "account_status": true,
                            "message": "Could not fetch scooters",
                            "errors": ['Server error could not fetch scooters'],
                            "data": []
                        }
                    );
            });
        });
    }

    getAddressFromLatLng(req.query.latitude, req.query.longitude)
})




app.listen(8080, () => {
    console.log('app run on port 8080');
})
