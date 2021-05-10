const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("brypt");
const jwt = require("jsonwebtoken");

app.use(express.json());

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split()[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
        SELECT 
            *
        FROM
            user
        WHERE username='${username}';
    `;
  const dbUser = await db.get(userQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    passwordMatch = bcrypt.compare(password, dbUuser.password);
    if (passwordMatch === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// get states api

app.get("/states", authentication, async (request, response) => {
  const getStatesQuery = `
        SELECT * FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((state) => {
      return {
        stateId: state.state_id,
        stateName: state.state_name,
        population: state.population,
      };
    })
  );
});

// get a state using stateId API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

//create a district API

app.post("/districts/", async (request, response) => {
  const district = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = district;
  const createDistrictQuery = `
    INSERT INTO
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}, ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
    );

    `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// get a district API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const state = await db.get(getDistrictQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});

// delete district API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery =
    "DELETE FROM district WHERE district_id=${districtId}";
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// upadate district API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const district = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = district;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET
        district_name='${districtName},
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE district_id = ${districtId}
    ;

    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// get state stats API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(getStateStatsQuery);
  response.send({
    totalCases: state.cases,
    totalCured: state.cured,
    totalActive: state.active,
    totalDeaths: state.deaths,
  });
});

module.exports = app;
