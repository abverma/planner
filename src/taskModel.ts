import mongoose from 'mongoose'
import BaseModel from './baseModel'

interface taskType {
    subject?: string,
    score?: number,
    date?: Date,
    creation_date?: string
}
export default class Task extends BaseModel{
    model: any
    taskSchema = new mongoose.Schema<taskType>({
        subject: String,
        score: Number,
        date: Date,
        creation_date: Date
    })
    constructor(db: BaseModel) {
        super(db.db)
        this.model = this.db.model<taskType>('tasks', this.taskSchema);
    }
    async create(task: {[key:string]: any}) {
        const newTask = new this.model(task);
        return newTask.save()
    }
    async find(filter: any, limit?: number) {
        return limit ? this.model.find(filter).sort([['_id', -1]]).limit(limit) : this.model.find(filter).sort([['_id', -1]])
    }
    async delete(filter: any) {
        console.log(JSON.stringify(filter))
        return this.model.deleteMany(filter)
    }
}



async function main() {
    await mongoose.connect('mongodb://localhost:27017/planner')
}