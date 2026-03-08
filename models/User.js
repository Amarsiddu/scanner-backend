import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  username:{
    type:String,
    required:true
  },

  email:{
    type:String,
    unique:true
  },

  phone:{
    type:String,
    unique:true
  },

  password:{
    type:String,
    required:true
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});

export default mongoose.model("User", userSchema);