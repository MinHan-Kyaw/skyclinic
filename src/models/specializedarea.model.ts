import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import { BaseModel } from './common.model';

export interface ISA extends BaseModel{
    said: Number,
    name: String,
}

@singleton()
export default class ISAClass {
    Schema = mongoose.Schema;

    specializedschema = new this.Schema({
        said: Number,
        name: String,
        ...BaseModel
    });
    model = mongoose.models.specializedarea || mongoose.model("specializedarea", this.specializedschema);
}

