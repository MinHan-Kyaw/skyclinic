import mongoose from "mongoose";
import { singleton } from "tsyringe";
import { BaseModel } from "./common.model";

export interface Schedule extends BaseModel {
  scheduleid: String;
  clinicid: String;
  doctorid: String; // appuserid
  starttime: String; // Opening Hours Start Time
  endtime: String; // Opening Hours End Time
  monday: Boolean;
  tuesday: Boolean;
  wednesday: Boolean;
  thursday: Boolean;
  friday: Boolean;
  saturday: Boolean;
  sunday: Boolean;
  closedonph: Boolean; // Closed on Public Holidays
}

export interface ScheduleInput {
  userid: String;
  clinicid: String;
  doctorid: String; // appuserid
  starttime: String; // Opening Hours Start Time
  endtime: String; // Opening Hours End Time
  monday: Boolean;
  tuesday: Boolean;
  wednesday: Boolean;
  thursday: Boolean;
  friday: Boolean;
  saturday: Boolean;
  sunday: Boolean;
  closedonph: Boolean; // Closed on Public Holidays
}

export interface ScheduleUpdate {
  scheduleid: String;
  userid: String;
  clinicid: String;
  doctorid: String; // appuserid
  starttime: String; // Opening Hours Start Time
  endtime: String; // Opening Hours End Time
  monday: Boolean;
  tuesday: Boolean;
  wednesday: Boolean;
  thursday: Boolean;
  friday: Boolean;
  saturday: Boolean;
  sunday: Boolean;
  closedonph: Boolean; // Closed on Public Holidays
}

export interface ScheduleGet {
  userid: String;
  clinicid: String;
  doctorid: String;
}

export interface ScheduleDelete {
  userid: String;
  scheduleid: String;
}

@singleton()
export default class IScheduleClass {
  Schema = mongoose.Schema;

  scheduleschema = new this.Schema({
    scheduleid: String,
    clinicid: String,
    doctorid: String, // appuserid
    starttime: String, // Opening Hours Start Time
    endtime: String, // Opening Hours End Time
    monday: Boolean,
    tuesday: Boolean,
    wednesday: Boolean,
    thursday: Boolean,
    friday: Boolean,
    saturday: Boolean,
    sunday: Boolean,
    closedonph: Boolean,
    ...BaseModel,
  });
  model =
    mongoose.models.doctor || mongoose.model("doctor", this.scheduleschema);
}
