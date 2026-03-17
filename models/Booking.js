import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    index: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  startTime: {
    type: Date,
    required: true,
    unique: true   // prevents double booking
  },

  endTime: {
    type: Date,
    required: true
  },

  meetingLink: {
    type: String
  },

  status: {
    type: String,
    default: "confirmed"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Booking", bookingSchema);