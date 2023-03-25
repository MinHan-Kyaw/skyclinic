import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import { BaseModel } from './common.model';

export interface Clinic extends BaseModel{
    clinicid: String,
    clinicname: String,
    owner: String[], // appuserid
    address: String,
    phone: String[],
    website: String,
    clinicidentifiednumber: String, // clinic license or registration no
    clinicidentifiedphoto: String,
}

export interface ClinicInput{
    userid: String,
    clinicname: String,
    address: String,
    phone: [], 
    website: String,
    clinicidentifiednumber: String,// clinic license or registration no
}

export interface GetClinicModel{
    userid: String
}

@singleton()
export default class ClinicClass {
    Schema = mongoose.Schema;

    clinicschema = new this.Schema({
        clinicid: String,
        clinicname: String,
        owner: [String], // appuserid
        address: String,
        phone: [String],
        website: String,
        clinicidentifiednumber: String, // clinic license or registration no
        clinicidentifiedphoto: String,
        ...BaseModel
    });
    model = mongoose.models.clinic || mongoose.model("clinic", this.clinicschema);
}

