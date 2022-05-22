import mongoose from 'mongoose'

interface userType {
    username: string,
    password: string
}

interface taskCategoryType {
    subject: string,
    category: string
}

interface taskType {
    subject?: string,
    score?: number,
    date?: Date,
    creation_date?: string,
    category?: string
}

interface categoryScoreType {
    category: string,
    score: number
}

const taskSchema = new mongoose.Schema<taskType>({
    subject: String,
    score: Number,
    date: Date,
    creation_date: Date,
    category: String
})

const userSchema = new mongoose.Schema<userType>({
    username: String,
    password: String
})

const taskCategorySchema = new mongoose.Schema<taskCategoryType>({
    subject: String,
    category: String
})

const categoryScoreSchema = new mongoose.Schema<categoryScoreType>({
    category: String,
    score: Number
})

export function TaskCategoriesModel (mongooose: mongoose.Mongoose) {
    return mongoose.model<taskCategoryType>('task_categories', taskCategorySchema)
}

export function UserModel (mongoose: mongoose.Mongoose) {
    return mongoose.model<userType>('users', userSchema)
}

export function TaskModel (mongoose: mongoose.Mongoose) {
    return mongoose.model<taskType>('tasks', taskSchema)
}

export function CategoryScoreModel (mongoose: mongoose.Mongoose) {
    return mongoose.model<categoryScoreType>('category_scores', categoryScoreSchema)
}