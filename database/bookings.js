// database/bookings.js

const bookings = [];

// Create booking
export function createBooking(name, email, startTime) {

  const booking = {
    id: Date.now().toString(),
    name,
    email,
    startTime,
    endTime: new Date(new Date(startTime).getTime() + 30 * 60000),
    createdAt: new Date()
  };

  bookings.push(booking);

  return booking;
}

// Get bookings
export function getBookings() {
  return bookings;
}