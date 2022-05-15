import mongoose from 'mongoose'
import BaseModel from './baseModel'
import moment from 'moment'

interface taskType {
    subject: string,
    category: string
}
export default class TaskCategories extends BaseModel{
    model: any
    schema = new mongoose.Schema<taskType>({
        subject: String,
        category: String
    })
    constructor(db: BaseModel) {
        super(db.db)
        this.model = this.db.model<taskType>('task_categories', this.schema);
    }
    async findOne(query: any) {
        console.log(JSON.stringify(query))
        return this.model.findOne(query)
    }
    async find(query: any, limit = 0, skip = 0) {
        console.log(JSON.stringify(query))
        return this.model.find(query).skip(skip).limit(limit)
    }
}