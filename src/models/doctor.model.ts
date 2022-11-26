import mongoose from "mongoose";
import { singleton } from "tsyringe";
import { BaseModel } from "./common.model";

export interface Idoctor extends BaseModel {
    appuserid: String,
    doctorid: String,
    doctorname: String, // title to declare to patient
    smno: String, // sama number
    expdate: Date,
    smphoto: String, // Sama photo
    degreename: String, // first degree name
    guni: String, // first degree's graduated uni
    gyear: String, // first degree's graduated year
    grecord: String, //first degree's upload graduated record - photo
    degrees: IDegree[], // Secondary Degrees - Degree Object Array
    phone: String,
    specializedarea: [], 
}

export interface IDegree{
    degreename: String, // first degree name
    guni: String, // first degree's graduated uni
    gyear: String, // first degree's graduated year
    grecord: String,
}

export interface IDoctorInput{
    userid: String,
    doctorname: String, // title to declare to patient
    smno: String, // sama number
    expdate: Date,
    degreename: String, // first degree name
    guni: String, // first degree's graduated uni
    gyear: String, // first degree's graduated year
    phone: String,
    specializedarea: [],
}

@singleton()
export default class IdoctorClass {
    Schema = mongoose.Schema;

    doctorschema = new this.Schema({
        appuserid: String,
        doctorid: String,
        doctorname: String, // title to declare to patient
        smno: String, // sama number
        expdate: Date,
        smphoto: String,
        degreename: String, // Degree name
        guni: String, // graduated uni
        gyear: String, // graduated year
        grecord: String, //upload graduated record
        degree: [],
        phone: String,
        specializedarea: [],
        ...BaseModel
    });
    model = mongoose.models.doctor || mongoose.model("doctor", this.doctorschema);
}
