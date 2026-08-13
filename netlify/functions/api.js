import express from "express";
import serverless from "serverless-http";
import { connectDB } from "./utils/db.js";
import { fail } from "./utils/apiHelpers.js";
import customerAuthEntry from "./routes/customerAuthEntry.js";
import customerAuthLogin from "./routes/customerAuthLogin.js";
import customerProfile from "./routes/customerProfile.js";
import customerPush from "./routes/customerPush.js";
import customerPendingTransaction from "./routes/customerPendingTransaction.js";
import customerTestimonial from "./routes/customerTestimonial.js";
import adminTestimonials from "./routes/adminTestimonials.js";
import availability from "./routes/availability.js";
import adminLogin from "./routes/adminLogin.js";
import adminPush from "./routes/adminPush.js";
import adminCustomersList from "./routes/adminCustomersList.js";
import adminCustomersActions from "./routes/adminCustomersActions.js";
import adminTransactionsCreate from "./routes/adminTransactionsCreate.js";
import adminTransactionsUpdate from "./routes/adminTransactionsUpdate.js";
import adminGeocodeDistance from "./routes/adminGeocodeDistance.js";
import geocodeDistance from "./routes/geocodeDistance.js";

const app = express();
app.use(express.json());

// Every request needs a DB connection before touching a model.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    fail(res, err);
  }
});

// Each imported router only knows its own routes (see netlify/functions/routes/*)
// — mounting them all under /api reproduces the single flat router this file
// used to define inline.
app.use(
  "/api",
  customerAuthEntry,
  customerAuthLogin,
  customerProfile,
  customerPush,
  customerPendingTransaction,
  customerTestimonial,
  availability,
  adminLogin,
  adminPush,
  adminCustomersList,
  adminCustomersActions,
  adminTransactionsCreate,
  adminTransactionsUpdate,
  adminGeocodeDistance,
  adminTestimonials,
  geocodeDistance
);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

export const handler = serverless(app);
