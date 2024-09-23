import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);  // No need to pass deprecated options
    console.log('Database Connected');
    
    mongoose.connection.on('error', (err) => {
      console.error(`Database connection error: ${err.message}`);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1); // Exit process with failure if connection fails
  }
};

export default connectDB;
