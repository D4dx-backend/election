const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const cors = require("cors");
const connectDB = require("./config/db.js");
const { handleError } = require("./utils/errorLog.js");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:8001",
  "http://localhost:4000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://election-portal-web.netlify.app",
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((u) => u.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.set("view engine", "ejs");
app.use("/images", express.static("./public/user"));
app.use("/images", express.static("./public/proteincategory"));
app.use("/css", express.static(path.resolve(__dirname, "assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "assets/js")));
// User-uploaded images (franchise logos, election banners)
app.use("/uploads", express.static(path.resolve(__dirname, "public/uploads")));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route files
const user = require("./routes/users.js");
const franchise = require("./routes/Franchise.js");
const auditLog = require("./routes/auditLog.js");
const electionAnalytics = require("./routes/electionAnalytics.js");
const electionGroup = require("./routes/electionGroup.js");
const election = require("./routes/election.js");
const nominee = require("./routes/nominee.js");
const vote = require("./routes/vote.js");
const voterGroup = require("./routes/voterGroup.js");
const auth = require("./routes/auth.js");
const onboarding = require("./routes/onboarding.js");
const notifications = require("./routes/notifications.js");


app.use("/api/v1/auth", auth);
app.use("/api/v1/user", user);
app.use("/api/v1/franchise", franchise);
app.use("/api/v1/auditLog", auditLog);
app.use("/api/v1/electionAnalytics", electionAnalytics);
app.use("/api/v1/electionGroup", electionGroup);
app.use("/api/v1/election", election);
app.use("/api/v1/nominee", nominee);
app.use("/api/v1/vote", vote);
app.use("/api/v1/voterGroup", voterGroup);
app.use("/api/v1/onboarding", onboarding);
app.use("/api/v1/notifications", notifications);

// --- Centralized Error Handling --- MUST BE THE LAST MIDDLEWARE
app.use(handleError);

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Startup failed: ${message}`);
    process.exit(1);
  }
}

startServer();
