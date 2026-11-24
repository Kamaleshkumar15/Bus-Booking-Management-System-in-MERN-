export default function SeatMap2DFallback({
  seats = [],
  selectedSeatIds = [],
  currentUserId,
  onToggleSeat,
}) {
  const lowerSeats = seats.filter((s) => s.deck === 'lower');
  const upperSeats = seats.filter((s) => s.deck === 'upper');

  const getSeatStyle = (seat) => {
    const isLockedByMe = seat.status === 'locked' && seat.lockedBy === currentUserId;
    const isLockedByOther = seat.status === 'locked' && seat.lockedBy !== currentUserId;

    if (seat.status === 'unavailable') {
      return 'bg-slate-400 text-white cursor-not-allowed border-slate-500';
    }
    if (seat.status === 'booked' || isLockedByOther) {
      return 'bg-red-600 text-white cursor-not-allowed border-red-700';
    }
    if (selectedSeatIds.includes(seat._id) || isLockedByMe) {
      return 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300';
    }
    return 'bg-green-600 text-white hover:bg-green-700 border-green-700 cursor-pointer';
  };

  const renderDeck = (title, deckSeats) => {
    if (deckSeats.length === 0) return null;
    const rows = Array.from(new Set(deckSeats.map((s) => s.row))).sort((a, b) => a - b);

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{title}</h4>
          <span className="text-xs text-slate-500">Front of Bus ↑</span>
        </div>
        <div className="space-y-2.5">
          {rows.map((rowNum) => {
            const rowSeats = deckSeats.filter((s) => s.row === rowNum).sort((a, b) => a.col - b.col);
            return (
              <div key={rowNum} className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {rowSeats
                    .filter((s) => s.col <= 2)
                    .map((seat) => {
                      const disabled =
                        seat.status === 'booked' ||
                        seat.status === 'unavailable' ||
                        (seat.status === 'locked' && seat.lockedBy !== currentUserId);
                      return (
                        <button
                          key={seat._id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onToggleSeat(seat)}
                          title={`${seat.seatNumber} (${seat.seatType}) - ₹${seat.price}`}
                          className={`${
                            seat.seatType === 'sleeper' ? 'w-14 h-12' : 'w-11 h-11'
                          } rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition ${getSeatStyle(
                            seat
                          )}`}
                        >
                          <span>{seat.seatNumber}</span>
                          <span className="text-[10px] font-normal opacity-90">₹{seat.price}</span>
                        </button>
                      );
                    })}
                </div>
                <div className="w-6 text-center text-[10px] text-slate-300 font-medium">Aisle</div>
                <div className="flex gap-2">
                  {rowSeats
                    .filter((s) => s.col > 2)
                    .map((seat) => {
                      const disabled =
                        seat.status === 'booked' ||
                        seat.status === 'unavailable' ||
                        (seat.status === 'locked' && seat.lockedBy !== currentUserId);
                      return (
                        <button
                          key={seat._id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onToggleSeat(seat)}
                          title={`${seat.seatNumber} (${seat.seatType}) - ₹${seat.price}`}
                          className={`${
                            seat.seatType === 'sleeper' ? 'w-14 h-12' : 'w-11 h-11'
                          } rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition ${getSeatStyle(
                            seat
                          )}`}
                        >
                          <span>{seat.seatNumber}</span>
                          <span className="text-[10px] font-normal opacity-90">₹{seat.price}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderDeck('Lower Deck', lowerSeats)}
      {renderDeck('Upper Deck', upperSeats)}
    </div>
  );
}
