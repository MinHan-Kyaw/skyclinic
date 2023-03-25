import mongoose from "mongoose";
import { singleton } from "tsyringe";
import { BaseModel } from "./common.model";

export interface Appointment extends BaseModel {
  appointmentid: String,
  clinicid: String;
  appuserid: String; // patient id
  doctorid: String; // Optional since the appointment can be with just clinic
  date: String;
  time: String;
  initialinfo: String;
  status: String;
}

export interface AppointmentInput {
  userid: String;
  clinicid: String;
  appuserid: String; // patient id
  doctorid: String; // Optional since the appointment can be with just clinic
  date: String;
  time: String;
  initialinfo: String;
  status: String;
}

export interface AppointmentUpdate {
  appointmentid: String;
  userid: String;
  clinicid: String;
  appuserid: String; // patient id
  doctorid: String; // Optional since the appointment can be with just clinic
  date: String;
  time: String;
  initialinfo: String;
  status: String;
}

@singleton()
export default class AppointmentClass {
  Schema = mongoose.Schema;

  appintmentschema = new this.Schema({
    appointmentid: String,
    clinicid: String,
    appuserid: String, // patient id
    doctorid: String, // Optional since the appointment can be with just clinic
    date: String,
    time: String,
    initialinfo: String,
    status: String,
    ...BaseModel,
  });
  model =
    mongoose.models.appointment ||
    mongoose.model("appointment", this.appintmentschema);
}
