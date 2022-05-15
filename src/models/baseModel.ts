import mongoose from "mongoose"

export default class BaseModel {
    db

    constructor (db: mongoose.Mongoose) {
        this.db = db
    }
}