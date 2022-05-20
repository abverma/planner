import mongoose from 'mongoose'

interface taskType {
    subject: string,
    category: string
}

const schema = new mongoose.Schema<taskType>({
    subject: String,
    category: String
})


export default function (mongooose: mongoose.Mongoose) {
    return mongoose.model<taskType>('task_categories', schema)
}
