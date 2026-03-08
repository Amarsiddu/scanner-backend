import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router = express.Router();


// SIGNUP
router.post("/signup", async (req,res)=>{

  const {username,email,phone,password} = req.body;

  const existing = await User.findOne({
    $or:[{email},{phone}]
  });

  if(existing){
    return res.json({
      success:false,
      message:"User already exists"
    });
  }

  const hashed = await bcrypt.hash(password,10);

  const user = new User({
    username,
    email,
    phone,
    password:hashed
  });

  await user.save();

  res.json({
    success:true,
    message:"User created"
  });

});


// LOGIN
router.post("/login", async (req,res)=>{

  const {identifier,password} = req.body;

  const user = await User.findOne({
    $or:[
      {email:identifier},
      {phone:identifier},
      {username:identifier}
    ]
  });

  if(!user){
    return res.json({success:false});
  }

  const valid = await bcrypt.compare(password,user.password);

  if(!valid){
    return res.json({success:false});
  }

  const token = jwt.sign(
    {userId:user._id},
    process.env.JWT_SECRET,
    {expiresIn:"7d"}
  );

  res.json({
    success:true,
    token
  });

});

export default router;