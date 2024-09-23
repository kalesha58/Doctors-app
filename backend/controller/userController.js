import { STATUS_CODES, ERROR_MESSAGES } from '../constants/appConstant.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import logger from '../logger.js'
import validator from 'validator';
import cloudinary from 'cloudinary'; 

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input data
        if (!name || !email || !password) {
            logger.info(`Register failed: ${ERROR_MESSAGES.MISSING_DETAILS}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: ERROR_MESSAGES.MISSING_DETAILS });
        }

        if (!validator.isEmail(email)) {
            logger.info(`Register failed: ${ERROR_MESSAGES.INVALID_EMAIL} - ${email}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: ERROR_MESSAGES.INVALID_EMAIL });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            logger.info(`Register failed: ${ERROR_MESSAGES.EMAIL_EXISTS} - ${email}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: ERROR_MESSAGES.EMAIL_EXISTS });
        }

        if (password.length < 8) {
            logger.info(`Register failed: ${ERROR_MESSAGES.WEAK_PASSWORD} for email - ${email}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: ERROR_MESSAGES.WEAK_PASSWORD });
        }

        // Hash password and create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = { name, email, password: hashedPassword };
        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        logger.info(`User registered successfully: ${email}`);
        res.status(STATUS_CODES.CREATED).json({ success: true, token, message: ERROR_MESSAGES.USER_REGISTER_SUCCESS });
    } catch (error) {
        logger.error(`Error during registration for email - ${req.body.email}: ${error.message}`);
        res.status(STATUS_CODES.SERVER_ERROR).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            logger.info(`Login failed: ${ERROR_MESSAGES.MISSING_DETAILS}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: ERROR_MESSAGES.MISSING_DETAILS });
        }

        // Check if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            logger.info(`Login failed: ${ERROR_MESSAGES.USER_NOT_FOUND} - ${email}`);
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: ERROR_MESSAGES.USER_NOT_FOUND });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.info(`Login failed: ${ERROR_MESSAGES.INVALID_CREDENTIALS} for email - ${email}`);
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: ERROR_MESSAGES.INVALID_CREDENTIALS });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Log successful login
        logger.info(`User logged in successfully: ${email}`);
        return res.status(STATUS_CODES.OK).json({ success: true, token });
    } catch (error) {
        logger.error(`Error during login for email - ${email}: ${error.message}`);
        return res.status(STATUS_CODES.SERVER_ERROR).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
    }
};

export const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        // Log initial request data
        logger.info(`User Profile Update Request for UserId: ${userId}`);

        // Check for missing required fields
        if (!name || !phone || !dob || !gender) {
            logger.warn(`Missing data for profile update: UserId: ${userId}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.DATA_MISSING || "Data Missing"
            });
        }

        // Parse address field, if exists
        const parsedAddress = address ? JSON.parse(address) : undefined;

        // Update user information (excluding image)
        await userModel.findByIdAndUpdate(userId, {
            name, 
            phone, 
            address: parsedAddress, 
            dob, 
            gender
        });

        // If an image file is provided, upload to Cloudinary and update user's image
        if (imageFile) {
            logger.info(`Uploading profile image for UserId: ${userId}`);
            
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageURL = imageUpload.secure_url;

            // Update user with the image URL
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
            logger.info(`Profile image updated for UserId: ${userId}, Image URL: ${imageURL}`);
        }

        logger.info(`Profile updated successfully for UserId: ${userId}`);
        res.status(STATUS_CODES.OK).json({ 
            success: true, 
            message: 'Profile Updated' 
        });

    } catch (error) {
        // Log error details
        logger.error(`Error updating profile for UserId: ${req.body.userId}: ${error.message}`);
        res.status(STATUS_CODES.SERVER_ERROR).json({ 
            success: false, 
            message: ERROR_MESSAGES.SERVER_ERROR || error.message 
        });
    }
};


// API to book appointment 
export const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;
        logger.info(`Booking appointment for UserId: ${userId} with DoctorId: ${docId} on ${slotDate} at ${slotTime}`);

        // Fetching doctor data
        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData.available) {
            logger.warn(`DoctorId: ${docId} is not available`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Doctor Not Available' });
        }

        let slots_booked = docData.slots_booked;

        // Checking for slot availability
        if (slots_booked[slotDate]?.includes(slotTime)) {
            logger.warn(`Slot already booked for DoctorId: ${docId} on ${slotDate} at ${slotTime}`);
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Slot Not Available' });
        }

        // Book the slot
        slots_booked[slotDate] = slots_booked[slotDate] || [];
        slots_booked[slotDate].push(slotTime);

        // Fetching user data
        const userData = await userModel.findById(userId).select("-password");

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Save updated slot bookings in doctor's data
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        logger.info(`Appointment successfully booked for UserId: ${userId} with DoctorId: ${docId}`);
        res.status(STATUS_CODES.CREATED).json({ success: true, message: 'Appointment Booked' });

    } catch (error) {
        logger.error(`Error booking appointment for UserId: ${req.body.userId}: ${error.message}`);
        res.status(STATUS_CODES.SERVER_ERROR).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR || error.message });
    }
};

// API to cancel appointment
export const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        logger.info(`Canceling appointment for UserId: ${userId} AppointmentId: ${appointmentId}`);

        const appointmentData = await appointmentModel.findById(appointmentId);

        // Verify appointment user
        if (appointmentData.userId !== userId) {
            logger.warn(`Unauthorized cancellation attempt by UserId: ${userId} for AppointmentId: ${appointmentId}`);
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Releasing doctor slot
        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);

        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(slot => slot !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        logger.info(`Appointment cancelled for UserId: ${userId} AppointmentId: ${appointmentId}`);
        res.status(STATUS_CODES.OK).json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        logger.error(`Error canceling appointment for UserId: ${req.body.userId}: ${error.message}`);
        res.status(STATUS_CODES.SERVER_ERROR).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR || error.message });
    }
};

// API to get user appointments for frontend my-appointments page
export const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        logger.info(`Fetching appointments for UserId: ${userId}`);

        const appointments = await appointmentModel.find({ userId });

        logger.info(`Appointments fetched successfully for UserId: ${userId}`);
        res.status(STATUS_CODES.OK).json({ success: true, appointments });

    } catch (error) {
        logger.error(`Error fetching appointments for UserId: ${req.body.userId}: ${error.message}`);
        res.status(STATUS_CODES.SERVER_ERROR).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR || error.message });
    }
};

export {
    loginUser,
    registerUser,
}