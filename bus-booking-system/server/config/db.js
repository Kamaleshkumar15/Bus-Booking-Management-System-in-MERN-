const jsonDb = require('./jsonDb');
const { seedData } = require('../seed/seedData');

const connectDB = async () => {
  const users = jsonDb.readJSON('users');
  const trips = jsonDb.readJSON('trips');
  if (users.length === 0 && trips.length === 0) {
    console.log('JSON database is empty. Auto-seeding initial data...');
    await seedData();
  }
  console.log(`Local JSON Database Ready: ${jsonDb.getDatabaseDir()}`);
};

module.exports = connectDB;
