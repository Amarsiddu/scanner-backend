import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendEmail, sendSMS } from "../services/notification.js";

const router = express.Router();


// ==========================
// GET AVAILABLE SLOTS
// ==========================

router.get("/available-slots", async (req, res) => {

  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date required" });
    }

    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30;

   const slots = [];

for (let hour = startHour; hour < endHour; hour++) {

  for (let minute = 0; minute < 60; minute += slotDuration) {

    const slot = new Date(`${date}T00:00:00+05:30`);

    slot.setHours(hour, minute, 0, 0);

    slots.push(slot.toISOString());

  }
}

   const bookings = await Booking.find({
  startTime: {
    $gte: new Date(date + "T00:00:00+05:30"),
    $lt: new Date(date + "T23:59:59+05:30")
  }
});

    const bookedTimes = bookings.map(b =>
      new Date(b.startTime).toISOString()
    );

    const availableSlots = slots.filter(
      slot => !bookedTimes.includes(slot)
    );

    res.json(availableSlots);

  } catch (error) {

    console.error(error);

    res.status(500).json({ error: "Slot generation failed" });

  }

});


// ==========================
// CREATE BOOKING
// ==========================

router.post("/create-booking", async (req, res) => {

  try {

    const { username, startTime } = req.body;

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Prevent double booking
    const existing = await Booking.findOne({
      startTime: new Date(startTime)
    });

    if (existing) {
      return res.status(400).json({
        error: "Slot already booked"
      });
    }

    const endTime = new Date(
      new Date(startTime).getTime() + 30 * 60000
    );

    // Simple Google Meet link
    const meetingLink = "https://meet.google.com/new";

    const booking = await Booking.create({

      username: user.username,
      email: user.email,
      phone: user.phone,

      startTime,
      endTime,
      meetingLink

    });

    // Convert time to Indian time
    const formattedTime = new Date(startTime).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const message = `
Appointment Confirmed ✅

Hello ${user.username},

Your appointment has been successfully booked.

Date & Time: ${formattedTime}
Duration: 30 minutes

Meeting Link:
${meetingLink}

Thank you.
`;

    // Send Email
    try {
      await sendEmail(user.email, message);
      console.log("Email sent to:", user.email);
    } catch (err) {
      console.log("Email sending failed:", err.message);
    }

    // Send SMS
    try {
      await sendSMS(user.phone, message);
      console.log("SMS sent to:", user.phone);
    } catch (err) {
      console.log("SMS sending failed:", err.message);
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Booking failed"
    });

  }

});


// ==========================
// GET USER BOOKINGS
// ==========================

router.get("/my-bookings/:username", async (req, res) => {

  try {

    const { username } = req.params;

    const bookings = await Booking.find({ username })
      .sort({ startTime: 1 });

    res.json(bookings);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to fetch bookings"
    });

  }

});

export default router;