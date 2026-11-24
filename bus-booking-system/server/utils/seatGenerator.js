/**
 * Generates seat documents for a trip based on bus seatLayoutType and totalSeats.
 * Supports 'seater', 'sleeper', and 'mixed' (lower seater + upper sleeper) layouts.
 */
function generateSeatsForTrip({ tripId, seatLayoutType = 'seater', totalSeats = 36, basePrice = 600, sleeperPrice = 950 }) {
  const seats = [];

  if (seatLayoutType === 'sleeper') {
    // 2 decks (lower & upper), 3 columns (1 left single, 2 right double) x 5 rows = 30 berths
    const rows = Math.ceil(totalSeats / 6);
    let count = 0;
    for (const deck of ['lower', 'upper']) {
      const prefix = deck === 'lower' ? 'L' : 'U';
      for (let r = 1; r <= rows && count < totalSeats; r++) {
        for (const col of [1, 2, 3]) {
          if (count >= totalSeats) break;
          count++;
          seats.push({
            tripId,
            seatNumber: `${prefix}${r}${col === 1 ? 'A' : col === 2 ? 'B' : 'C'}`,
            deck,
            row: r,
            col,
            seatType: 'sleeper',
            price: sleeperPrice || Math.round(basePrice * 1.4),
            status: 'available',
          });
        }
      }
    }
    return seats;
  }

  if (seatLayoutType === 'mixed') {
    // Lower deck: 2+2 seater; Upper deck: 1+2 sleeper
    const lowerTarget = Math.ceil(totalSeats * 0.6);
    const lowerRows = Math.ceil(lowerTarget / 4);
    let count = 0;

    for (let r = 1; r <= lowerRows && count < lowerTarget; r++) {
      for (const col of [1, 2, 3, 4]) {
        if (count >= lowerTarget) break;
        count++;
        seats.push({
          tripId,
          seatNumber: `L${r}${['A', 'B', 'C', 'D'][col - 1]}`,
          deck: 'lower',
          row: r,
          col,
          seatType: col === 1 || col === 4 ? 'window' : 'aisle',
          price: basePrice,
          status: 'available',
        });
      }
    }

    const upperRows = Math.ceil((totalSeats - count) / 3);
    for (let r = 1; r <= upperRows && count < totalSeats; r++) {
      for (const col of [1, 2, 3]) {
        if (count >= totalSeats) break;
        count++;
        seats.push({
          tripId,
          seatNumber: `U${r}${['A', 'B', 'C'][col - 1]}`,
          deck: 'upper',
          row: r,
          col,
          seatType: 'sleeper',
          price: sleeperPrice || Math.round(basePrice * 1.45),
          status: 'available',
        });
      }
    }
    return seats;
  }

  // Default: 'seater' (2+2 configuration on lower deck)
  const rows = Math.ceil(totalSeats / 4);
  let count = 0;
  for (let r = 1; r <= rows && count < totalSeats; r++) {
    for (const col of [1, 2, 3, 4]) {
      if (count >= totalSeats) break;
      count++;
      seats.push({
        tripId,
        seatNumber: `${r}${['A', 'B', 'C', 'D'][col - 1]}`,
        deck: 'lower',
        row: r,
        col,
        seatType: col === 1 || col === 4 ? 'window' : 'aisle',
        price: col === 1 || col === 4 ? basePrice + 50 : basePrice,
        status: 'available',
      });
    }
  }

  return seats;
}

module.exports = { generateSeatsForTrip };
