import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try{
        const mongoURI = process.env.MONGO_URI || "";

        if(!mongoURI){
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(mongoURI);

        console.log("Connected to MongoDB");
        console.log(mongoose.connection.readyState);
    }
    catch(error: any){
        console.log("mongodb connection failed",error.message);
        process.exit(1);
    }
};

export default connectDB;