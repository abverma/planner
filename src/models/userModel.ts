import mongoose from 'mongoose'

interface userType {
    username: string,
    password: string
}

const schema = new mongoose.Schema<userType>({
    username: String,
    password: String
})

export default function (mongoose: mongoose.Mongoose) {
    return mongoose.model<userType>('users', schema)
}