import mongoose from 'mongoose'
import BaseModel from './baseModel'

interface taskType {
    subject?: string,
    score?: number,
    date?: Date,
    creation_date?: string,
    category?: string
}
export default class Task extends BaseModel{
    model: any
    schema = new mongoose.Schema<taskType>({
        subject: String,
        score: Number,
        date: Date,
        creation_date: Date,
        category: String
    })
    constructor(db: BaseModel) {
        super(db.db)
        this.model = this.db.model<taskType>('tasks', this.schema);
    }
    async create(task: {[key:string]: any}) {
        const newTask = new this.model(task);
        return newTask.save()
    }
    async find(filter: any, limit?: number, skip = 0) {
        return limit ? this.model.find(filter).sort([['_id', -1]]).skip(skip).limit(limit) : this.model.find(filter).sort([['_id', -1]]).skip(skip)
    }
    async delete(filter: any) {
        console.log(JSON.stringify(filter))
        return this.model.deleteMany(filter)
    }
    async aggregate(pipelines: any) {
        return this.model.aggregate(pipelines)
    }
    async update(query: any, update: any) {
        return this.model.updateMany(query, update)
    }
    async count(query: any) {
        return this.model.count(query)
    }
}

async function main() {
    await mongoose.connect('mongodb://localhost:27017/planner')
}