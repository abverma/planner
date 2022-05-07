import mongoose from 'mongoose'

export default async function connnect(host: string, db: string) {
    await mongoose.connect(`mongodb://${host}/${db}`)
    return mongoose
}