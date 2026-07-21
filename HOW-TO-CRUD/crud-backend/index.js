var express = require('express');
var dotenv = require('dotenv');
var cors = require('cors');
var connectDB = require('./config/db.js');

var clientRoutes = require('./routes/clients');
var propertyRoutes = require('./routes/properties');
var roomRoutes = require('./routes/rooms');
var paymentRoutes = require('./routes/payments');
var eventRoutes = require('./routes/events');
var authRoutes = require('./routes/auth');
var workerRoutes = require('./routes/workerRoutes');


dotenv.config();
connectDB();

var app = express();
const port = process.env.PORT || 3000;
const clientURL = process.env.CLIENT_URL;

app.use(cors({
  origin: clientURL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use('/api/clients', clientRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workerRoutes', workerRoutes);


app.get("/", (req, res) => {
  res.send("🚀 Property Management API is running...");
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
