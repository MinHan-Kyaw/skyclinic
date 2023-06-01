import mongoose from "mongoose";
import { singleton } from "tsyringe";
import { BaseModel } from "./common.model";

export interface ITreatMent extends BaseModel {
  treatmentid: String,
  clinicid: String,
  doctorid: String,
  userid: String, //patient id
  desc: String, //doctor comment
  pressure: String,
  temperature: String,
  date?: Date,
  oxygenlevel: String,
  weight: String,
  document: []
}

export interface TreatMentInput {
  treatmentid: String,
    clinicid: String,
    doctorid: String,
    userid: String, //patient id
    desc: String, //doctor comment
    pressure: String,
    temperature: String,
    date?: Date,
    oxygenlevel: String,
    weight: String,
    document: [],
    created_user: String
}

@singleton()
export default class ITreatMentClass {
  Schema = mongoose.Schema;

  skcschema = new this.Schema({
    treatmentid: String,
    clinicid: String,
    doctorid: String,
    userid: String, //patient id
    desc: String, //doctor comment
    pressure: String,
    temperature: String,
    date: Date,
    oxygenlevel: String,
    weight: String,
    document: [],
    ...BaseModel
  });
  model = mongoose.models.treatment || mongoose.model("treatment", this.skcschema);
}
