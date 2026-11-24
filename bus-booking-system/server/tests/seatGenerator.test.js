const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSeatsForTrip } = require('../utils/seatGenerator');

test('generateSeatsForTrip generates correct seater layout', () => {
  const seats = generateSeatsForTrip({
    tripId: '507f1f77bcf86cd799439011',
    seatLayoutType: 'seater',
    totalSeats: 36,
    basePrice: 799,
  });
  assert.equal(seats.length, 36);
  assert.equal(seats[0].seatNumber, '1A');
  assert.equal(seats[0].seatType, 'window');
  assert.equal(seats[0].price, 849);
  assert.equal(seats[1].seatType, 'aisle');
  assert.equal(seats[1].price, 799);
});

test('generateSeatsForTrip generates lower and upper sleeper decks', () => {
  const seats = generateSeatsForTrip({
    tripId: '507f1f77bcf86cd799439011',
    seatLayoutType: 'sleeper',
    totalSeats: 30,
    basePrice: 800,
    sleeperPrice: 1199,
  });
  assert.equal(seats.length, 30);
  const lower = seats.filter((s) => s.deck === 'lower');
  const upper = seats.filter((s) => s.deck === 'upper');
  assert.equal(lower.length, 15);
  assert.equal(upper.length, 15);
  assert.equal(upper[0].price, 1199);
});

test('generateSeatsForTrip generates mixed seater + sleeper layout', () => {
  const seats = generateSeatsForTrip({
    tripId: '507f1f77bcf86cd799439011',
    seatLayoutType: 'mixed',
    totalSeats: 34,
    basePrice: 899,
    sleeperPrice: 1350,
  });
  assert.equal(seats.length, 34);
  assert.ok(seats.some((s) => s.deck === 'lower' && s.seatType !== 'sleeper'));
  assert.ok(seats.some((s) => s.deck === 'upper' && s.seatType === 'sleeper'));
});
