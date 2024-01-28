const express = require("express");
var csrf = require("csurf");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const { Admin, Sport, Player, Session, Join } = require("./models");
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
// const { request } = require('http');
const connectEnsureLogin = require("connect-ensure-login");

const app = express();
const saltRounds = 10;

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf({ cookie: true }));

app.use(
  session({
    secret: "my-secret-key-127287123873",
    resave: false, // Set to true if you want to force the session to be saved back to the session store, even if the session was never modified during the request.
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      const admin = await Admin.findOne({ where: { email: username } });
      const player = await Player.findOne({ where: { email: username } });

      if (admin) {
        const result = await bcrypt.compare(password, admin.password);
        if (result) {
          // User is an Admin
          return done(null, { user: admin, type: "admin" });
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      } else if (player) {
        const result = await bcrypt.compare(password, player.password);
        if (result) {
          // User is a Player
          return done(null, { user: player, type: "player" });
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      } else {
        return done(null, false, { message: "User not found" });
      }
    }
  )
);

passport.serializeUser((userObject, done) => {
  const { user, type } = userObject;
  console.log(`serializing ${type}`, user.id);
  done(null, { id: user.id, type });
});

passport.deserializeUser((serializedUser, done) => {
  const { id, type } = serializedUser;

  if (type === "admin") {
    Admin.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  } else if (type === "player") {
    Player.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  } else {
    done(null, false, { message: "Invalid user type during deserialization" });
  }
});

app.get("/", (request, response) => {
  response.render("index",{
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", { csrfToken: request.csrfToken() });
});

app.get("/login", (request, response) => {
  response.render("login", { csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});


app.post(
  "/sectionPlayer",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.redirect("/player");
  }
);

app.post(
  "/sectionAdmin",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.redirect("/sports");
  }
);

app.post("/create-admin", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const hashedPwd = await bcrypt.hash(password, saltRounds);
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      password: hashedPwd,
    });
    res.json(newAdmin);
  } catch (error) {
    console.error("Error creating Player:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-player", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const hashedPwd = await bcrypt.hash(password, saltRounds);
    await Player.create({
      firstName,
      lastName,
      email,
      password: hashedPwd,
    });
    res.redirect("/login");
  } catch (error) {
    console.error("Error creating Player:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/player",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const player = request.user;
    const sports = await Sport.getAll();
    const sessions = [];
    const joinedSessions = await Join.findAll({
      where: { playerId: player.id },
    });

    for (const sport of sports) {
      const sportSessions = await Session.findAll({
        where: { sportId: sport.id },
      });
      sessions.push(...sportSessions);
    }
    if (request.accepts("html")) {
      response.render("playerDashboard", {
        player,
        sports,
        sessions,
        joinedSessions,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        player,
        sports,
        sessions,
        joinedSessions,
        csrfToken: request.csrfToken(),
      });
    }
  }
);

app.get("/sports/:adminId", async (req, res) => {
  try {
    const adminId = req.params.adminId;

    // Check if the adminId is valid
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }
    const sports = await Sport.findAll({
      where: { adminId },
    });

    res.status(200).json({ sports });
  } catch (error) {
    console.error("Error retrieving sports:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete("/delete-sport/:sportId", async (req, res) => {
  try {
    const sportId = req.params.sportId;
    // Check if the sportId is valid and associated with the adminId
    const sport = await Sport.findOne({
      where: { id: sportId },
    });
    if (!sport) {
      throw new Error(
        "Sport not found or not associated with the specified admin."
      );
    }

    const result = await Sport.deleteSport(sportId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting sport:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-sport", async (req, res) => {
  try {
    const { adminId, name } = req.body;

    if (!adminId || !name) {
      return res
        .status(400)
        .json({ error: "Admin ID and sport name are required." });
    }
    console.log(adminId);

    // Check if the adminId is valid
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    await Sport.create({ name, adminId });
    res.redirect("/sports");
  } catch (error) {
    console.error("Error creating sport:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/sports", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const adminId = req.user.id;
    const sports = await Sport.getAllSports(adminId);
    const admin = await Admin.findOne({ where: { id: adminId } });
    const sessions = [];
    const allSports = await Sport.getAll();
    const allSessions = await Session.getAll();
    const allPlayers = await Player.getAll();
    const joinedSessions = await Join.getAll();

    for (const sport of sports) {
      const sportSessions = await Session.findAll({
        where: { sportId: sport.id },
      });
      sessions.push(...sportSessions);
    }

    res.render("adminDashboard", {
      sports,
      admin,
      sessions,
      allSessions,
      allSports,
      joinedSessions,
      allPlayers,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error("Error retrieving sports:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/players/:id", async (req, res) => {
  const playerId = req.params.id;

  try {
    const player = await Player.findByPk(playerId);

    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ error: "Player not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create-session", async (req, res) => {
  try {
    const { sportId, creator, date, time, venue, teamSize } = req.body;
    const quote = req.get("Referer");
    if (!sportId || !creator || !date || !time || !venue || !teamSize) {
      return res.json({
        error: "All fields are required.",
        sportId,
        creator,
        date,
        time,
        venue,
        teamSize,
      });
    }

    // Check if the provided sportId is valid
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.json({
        error: "Sport not found.",
        sportId,
        creator,
        date,
        time,
        venue,
        teamSize,
      });
    }

    // Create a new session
    const newSession = await Session.create({
      sportId,
      creator,
      date,
      time,
      venue,
      teamSize,
    });

    res.location(quote);

    res.status(302).json({
      message: "Session created successfully",
      session: newSession.toJSON(),
    });
  } catch (error) {
    console.error("Error creating session:", error.message);
    res.status(500).json({
      error: "Internal server error",
      sportId: req.body.sportId,
      creator: req.body.creator,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      teamSize: req.body.teamSize,
      originalRoute: req.get("Referer"),
    });
  }
});

app.delete(
  "/delete-session/:sessionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await Session.findOne({
        where: { id: sessionId, creator: req.user.email },
      });

      if (!session) {
        return res
          .status(404)
          .json({ error: "Session not found or unauthorized to delete." });
      }
      await session.destroy();

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/sessions/:sportId", async (req, res) => {
  try {
    const sportId = req.params.sportId;

    // Check if the provided sportId is valid
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ error: "Sport not found." });
    }
    const sessions = await Session.findAll({
      where: { sportId },
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error retrieving sessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/join", async (req, res) => {
  try {
    const playerId = req.body.playerId;
    const sessionId = req.body.sessionId;
    const teamSize = req.body.teamSize;

    const existingJoin = await Join.findOne({
      where: {
        playerId: playerId,
        sessionId: sessionId
      }
    });

    if (existingJoin) {
      res.status(400).send("You have already joined this session.");
      return;
    }
    
    if (teamSize > 0) {
      await Join.create({
        playerId: playerId,
        sessionId: sessionId,
        teamSize: teamSize,
      });

      await Session.update(
        { teamSize: Sequelize.literal('"teamSize" - 1') },
        { where: { id: sessionId } }
      );

      res.redirect("/player");
    } else {
      res.status(400).send("Team size is already zero. Cannot join session.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/sessions/:sportId/:sessionId", async (req, res) => {
  try {
    const sportId = req.params.sportId;
    const sessionId = req.params.sessionId;

    // Check if the provided sportId is valid
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return res.status(404).json({ error: "Sport not found." });
    }

    // Retrieve the session with the given id and sportId
    const session = await Session.findOne({
      where: { id: sessionId, sportId },
    });

    if (!session) {
      return res
        .status(404)
        .json({ error: "Session not found for the specified sport." });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error retrieving session:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// app.listen(3000, () => {
//   console.log(`Server is running at http://localhost:${3000}`);
// });

module.exports = app;
