import mongoose from 'mongoose'

interface taskType {
    subject?: string,
    score?: number,
    date?: Date,
    creation_date?: string,
    category?: string
}

const schema = new mongoose.Schema<taskType>({
    subject: String,
    score: Number,
    date: Date,
    creation_date: Date,
    category: String
})

export default function (mongoose: mongoose.Mongoose) {
    return mongoose.model<taskType>('tasks', schema)
}