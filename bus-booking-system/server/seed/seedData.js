require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/jsonDb');
const { generateSeatsForTrip } = require('../utils/seatGenerator');

const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

const seedData = async () => {
  console.log('Clearing existing JSON database files...');
  db.clearAll();

  const [adminHash, userHash, driverHash] = await Promise.all([
    hashPassword('Admin@123'),
    hashPassword('User@123'),
    hashPassword('Driver@123'),
  ]);

  console.log('Creating users & admin...');
  const [adminUser, customer1, customer2] = db.insertMany('users', [
    {
      name: 'System Admin',
      email: 'admin@bus.com',
      phone: '9876543200',
      password: adminHash,
      role: 'admin',
      gender: 'Other',
      address: 'HQ, Bengaluru, Karnataka',
      isActive: true,
    },
    {
      name: 'Demo User',
      email: 'user@bus.com',
      phone: '9876543210',
      password: userHash,
      role: 'user',
      gender: 'Male',
      address: 'Indiranagar, Bengaluru',
      isActive: true,
    },
    {
      name: 'Priya Sharma',
      email: 'priya@bus.com',
      phone: '9876543211',
      password: userHash,
      role: 'user',
      gender: 'Female',
      address: 'Anna Nagar, Chennai',
      isActive: true,
    },
  ]);

  console.log('Creating drivers...');
  const [driver1, driver2, driver3] = db.insertMany('drivers', [
    {
      name: 'Rajesh Kumar',
      email: 'driver@bus.com',
      phone: '9845011122',
      password: driverHash,
      licenseNumber: 'KA01-2016-0044123',
      licenseExpiry: new Date('2030-08-15').toISOString(),
      experienceYears: 9,
      status: 'active',
      assignedBuses: [],
      role: 'driver',
    },
    {
      name: 'Suresh Nair',
      email: 'suresh.driver@bus.com',
      phone: '9845022233',
      password: driverHash,
      licenseNumber: 'TN09-2018-0099112',
      licenseExpiry: new Date('2029-11-20').toISOString(),
      experienceYears: 7,
      status: 'active',
      assignedBuses: [],
      role: 'driver',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.driver@bus.com',
      phone: '9845033344',
      password: driverHash,
      licenseNumber: 'MH12-2015-0077221',
      licenseExpiry: new Date('2031-03-10').toISOString(),
      experienceYears: 11,
      status: 'active',
      assignedBuses: [],
      role: 'driver',
    },
  ]);

  console.log('Creating buses...');
  const [bus1, bus2, bus3, bus4] = db.insertMany('buses', [
    {
      busName: 'VRL Volvo 9600 Multi-Axle',
      busNumber: 'KA-01-AG-4590',
      operatorName: 'VRL Travels',
      busType: 'Volvo Multi-Axle',
      seatLayoutType: 'seater',
      totalSeats: 36,
      amenities: ['WiFi', 'AC', 'Charging Point', 'Water Bottle', 'Live Tracking', 'Reading Light'],
      rating: 4.7,
      totalReviews: 412,
      driverId: driver1._id,
      isActive: true,
    },
    {
      busName: 'SRS Luxury AC Sleeper',
      busNumber: 'KA-05-MN-7788',
      operatorName: 'SRS Travels',
      busType: 'AC Sleeper',
      seatLayoutType: 'sleeper',
      totalSeats: 30,
      amenities: ['AC', 'Blanket', 'Pillow', 'Charging Point', 'Reading Light', 'CCTV'],
      rating: 4.5,
      totalReviews: 298,
      driverId: driver2._id,
      isActive: true,
    },
    {
      busName: 'KPN Scania Seater/Sleeper',
      busNumber: 'TN-01-BC-9021',
      operatorName: 'KPN Travels',
      busType: 'AC Seater/Sleeper',
      seatLayoutType: 'mixed',
      totalSeats: 34,
      amenities: ['AC', 'WiFi', 'Charging Point', 'Emergency Exit', 'GPS'],
      rating: 4.4,
      totalReviews: 185,
      driverId: driver1._id,
      isActive: true,
    },
    {
      busName: 'Orange Express Non-AC Seater',
      busNumber: 'MH-12-XY-3310',
      operatorName: 'Orange Tours',
      busType: 'Non-AC Seater',
      seatLayoutType: 'seater',
      totalSeats: 40,
      amenities: ['Charging Point', 'Water Bottle', 'First Aid'],
      rating: 4.1,
      totalReviews: 120,
      driverId: driver3._id,
      isActive: true,
    },
  ]);

  db.updateById('drivers', driver1._id, { assignedBuses: [bus1._id, bus3._id] });
  db.updateById('drivers', driver2._id, { assignedBuses: [bus2._id] });
  db.updateById('drivers', driver3._id, { assignedBuses: [bus4._id] });

  console.log('Creating routes...');
  const [route1, route2, route3] = db.insertMany('routes', [
    {
      routeName: 'Bengaluru to Chennai',
      source: 'Bengaluru',
      destination: 'Chennai',
      distanceKm: 346,
      estimatedDurationMinutes: 390,
      isActive: true,
      stops: [
        { name: 'Majestic Bus Stand', city: 'Bengaluru', arrivalOffsetMinutes: 0, isBoardingPoint: true, isDroppingPoint: false, address: 'Kempegowda Bus Station' },
        { name: 'Silk Board', city: 'Bengaluru', arrivalOffsetMinutes: 35, isBoardingPoint: true, isDroppingPoint: false, address: 'Silk Board Junction' },
        { name: 'Vellore Bypass', city: 'Vellore', arrivalOffsetMinutes: 230, isBoardingPoint: false, isDroppingPoint: true, address: 'Green Circle' },
        { name: 'Koyambedu CMBT', city: 'Chennai', arrivalOffsetMinutes: 390, isBoardingPoint: false, isDroppingPoint: true, address: 'CMBT Terminal' },
      ],
    },
    {
      routeName: 'Chennai to Coimbatore',
      source: 'Chennai',
      destination: 'Coimbatore',
      distanceKm: 505,
      estimatedDurationMinutes: 510,
      isActive: true,
      stops: [
        { name: 'Koyambedu CMBT', city: 'Chennai', arrivalOffsetMinutes: 0, isBoardingPoint: true, isDroppingPoint: false, address: 'CMBT Terminal' },
        { name: 'Tambaram', city: 'Chennai', arrivalOffsetMinutes: 40, isBoardingPoint: true, isDroppingPoint: false, address: 'Tambaram Sanatorium' },
        { name: 'Salem New Bus Stand', city: 'Salem', arrivalOffsetMinutes: 330, isBoardingPoint: false, isDroppingPoint: true, address: 'AVR Roundana' },
        { name: 'Gandhipuram', city: 'Coimbatore', arrivalOffsetMinutes: 510, isBoardingPoint: false, isDroppingPoint: true, address: 'Gandhipuram Central' },
      ],
    },
    {
      routeName: 'Mumbai to Pune',
      source: 'Mumbai',
      destination: 'Pune',
      distanceKm: 150,
      estimatedDurationMinutes: 210,
      isActive: true,
      stops: [
        { name: 'Dadar East', city: 'Mumbai', arrivalOffsetMinutes: 0, isBoardingPoint: true, isDroppingPoint: false, address: 'Dadar TT Circle' },
        { name: 'Vashi Plaza', city: 'Navi Mumbai', arrivalOffsetMinutes: 40, isBoardingPoint: true, isDroppingPoint: false, address: 'Vashi Highway' },
        { name: 'Wakad', city: 'Pune', arrivalOffsetMinutes: 175, isBoardingPoint: false, isDroppingPoint: true, address: 'Wakad Flyover' },
        { name: 'Shivajinagar', city: 'Pune', arrivalOffsetMinutes: 210, isBoardingPoint: false, isDroppingPoint: true, address: 'Shivajinagar Stand' },
      ],
    },
  ]);

  console.log('Creating coupons...');
  db.insertMany('coupons', [
    { code: 'WELCOME10', discountPercent: 10, maxDiscount: 200, minOrder: 400, isActive: true },
    { code: 'BUS100', discountFlat: 100, maxDiscount: 100, minOrder: 600, isActive: true },
  ]);

  console.log('Creating trips & seats...');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dayOffsets = [0, 1, 2, 3];
  const createdTrips = [];

  for (const offset of dayOffsets) {
    const jDate = new Date(today);
    jDate.setUTCDate(today.getUTCDate() + offset);

    const tripConfigs = [
      { bus: bus1, route: route1, driver: driver1, departureTime: '06:30 AM', arrivalTime: '01:00 PM', duration: '6h 30m', basePrice: 799, sleeperPrice: 0 },
      { bus: bus2, route: route1, driver: driver2, departureTime: '10:30 PM', arrivalTime: '05:15 AM', duration: '6h 45m', basePrice: 1199, sleeperPrice: 1199 },
      { bus: bus3, route: route2, driver: driver1, departureTime: '09:00 PM', arrivalTime: '05:30 AM', duration: '8h 30m', basePrice: 899, sleeperPrice: 1350 },
      { bus: bus4, route: route3, driver: driver3, departureTime: '07:15 AM', arrivalTime: '10:45 AM', duration: '3h 30m', basePrice: 450, sleeperPrice: 0 },
    ];

    for (const cfg of tripConfigs) {
      const trip = db.insertOne('trips', {
        busId: cfg.bus._id,
        routeId: cfg.route._id,
        driverId: cfg.driver._id,
        journeyDate: jDate.toISOString(),
        departureTime: cfg.departureTime,
        arrivalTime: cfg.arrivalTime,
        duration: cfg.duration,
        basePrice: cfg.basePrice,
        sleeperPrice: cfg.sleeperPrice,
        totalSeats: cfg.bus.totalSeats,
        availableSeats: cfg.bus.totalSeats,
        status: 'Scheduled',
        boardingPoints: cfg.route.stops
          .filter((s) => s.isBoardingPoint)
          .map((s) => ({ name: s.name, time: cfg.departureTime, address: s.address })),
        droppingPoints: cfg.route.stops
          .filter((s) => s.isDroppingPoint)
          .map((s) => ({ name: s.name, time: cfg.arrivalTime, address: s.address })),
      });

      const seatDocs = generateSeatsForTrip({
        tripId: trip._id,
        seatLayoutType: cfg.bus.seatLayoutType,
        totalSeats: cfg.bus.totalSeats,
        basePrice: cfg.basePrice,
        sleeperPrice: cfg.sleeperPrice,
      });
      db.insertMany('seats', seatDocs);
      createdTrips.push(trip);
    }
  }

  const sampleTrip = createdTrips[0];
  const sampleSeats = db.findAll('seats', (s) => s.tripId === sampleTrip._id).slice(0, 2);
  const baseAmt = sampleSeats.reduce((sum, s) => sum + s.price, 0);
  const taxAmt = Math.round(baseAmt * 0.05);
  const convFee = 30;
  const totalAmt = baseAmt + taxAmt + convFee;

  const sampleBooking = db.insertOne('bookings', {
    bookingCode: 'BUS20260001',
    pnr: 'BUS20260001',
    userId: customer1._id,
    tripId: sampleTrip._id,
    seats: sampleSeats.map((s) => s._id),
    seatNumbers: sampleSeats.map((s) => s.seatNumber),
    passengers: [],
    boardingPoint: sampleTrip.boardingPoints[0],
    droppingPoint: sampleTrip.droppingPoints[sampleTrip.droppingPoints.length - 1],
    baseAmount: baseAmt,
    taxAmount: taxAmt,
    convenienceFee: convFee,
    discountAmount: 0,
    totalAmount: totalAmt,
    bookingStatus: 'Confirmed',
    paymentStatus: 'Paid',
    boarded: false,
    paymentId: null,
  });

  const samplePassengers = db.insertMany('passengers', [
    {
      bookingId: sampleBooking._id,
      tripId: sampleTrip._id,
      seatNumber: sampleSeats[0].seatNumber,
      fullName: 'Demo User',
      age: 29,
      gender: 'Male',
      phone: '9876543210',
      email: 'user@bus.com',
      boarded: false,
    },
    {
      bookingId: sampleBooking._id,
      tripId: sampleTrip._id,
      seatNumber: sampleSeats[1].seatNumber,
      fullName: 'Rohan Mehta',
      age: 26,
      gender: 'Male',
      phone: '9876543299',
      email: 'rohan@bus.com',
      boarded: false,
    },
  ]);

  const samplePayment = db.insertOne('payments', {
    bookingId: sampleBooking._id,
    userId: customer1._id,
    amount: totalAmt,
    currency: 'INR',
    paymentMethod: 'Demo UPI',
    upiId: 'user@okicici',
    upiChannel: 'GPay',
    gateway: 'simulated',
    gatewayOrderId: 'order_sim_seed_001',
    gatewayPaymentId: 'pay_sim_seed_001',
    transactionId: 'TXN-DEMO-1001',
    status: 'Success',
  });

  db.updateById('bookings', sampleBooking._id, {
    passengers: samplePassengers.map((p) => p._id),
    paymentId: samplePayment._id,
  });

  const seatIdSet = new Set(sampleSeats.map((s) => s._id));
  db.updateMany('seats', (s) => seatIdSet.has(s._id), {
    status: 'booked',
    bookingId: sampleBooking._id,
  });

  db.updateById('trips', sampleTrip._id, {
    availableSeats: sampleTrip.totalSeats - sampleSeats.length,
  });

  db.insertOne('notifications', {
    recipientId: customer1._id,
    recipientModel: 'User',
    title: 'Booking Confirmed',
    message: `Your booking ${sampleBooking.bookingCode} for Bengaluru to Chennai is confirmed.`,
    type: 'booking',
    isRead: false,
    relatedBookingId: sampleBooking._id,
  });

  db.logAudit({
    actorId: adminUser._id,
    actorRole: 'admin',
    action: 'SEED_DATABASE',
    entity: 'system',
    details: 'Initialized 13 local JSON database collections',
  });

  console.log('JSON Database Seed completed successfully!');
};

if (require.main === module) {
  seedData().catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = { seedData };
