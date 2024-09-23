import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, cancelAppointment,listAppointment,bookAppointment } from '../controller/userController.js';
import {authenticate, authUser} from "../middleware/auth.js"
import upload from '../middleware/mutlter.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)


userRouter.get("/getProfile", authUser, getProfile);

userRouter.post("/updateProfile", upload.single('image'), authUser, updateProfile)
userRouter.post("/bookAppointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancelAppointment", authUser, cancelAppointment)
export default userRouter;