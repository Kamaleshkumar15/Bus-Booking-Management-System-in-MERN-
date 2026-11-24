import { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [boardingPoint, setBoardingPoint] = useState(null);
  const [droppingPoint, setDroppingPoint] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);

  const resetBookingFlow = () => {
    setSelectedSeats([]);
    setBoardingPoint(null);
    setDroppingPoint(null);
    setPassengers([]);
    setCurrentBooking(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedTrip,
        setSelectedTrip,
        selectedSeats,
        setSelectedSeats,
        boardingPoint,
        setBoardingPoint,
        droppingPoint,
        setDroppingPoint,
        passengers,
        setPassengers,
        currentBooking,
        setCurrentBooking,
        resetBookingFlow,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
