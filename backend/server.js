const mongoose = require('mongoose');
const app = require('./app');

// Connects using MONGO_URI env var injected by docker-compose.yml.
// "db" in that URI is the MongoDB container's service name on the appnet
// network — resolved automatically by Docker's internal DNS.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});