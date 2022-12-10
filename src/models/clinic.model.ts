import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import { BaseModel } from './common.model';

export interface Clinic extends BaseModel{
    clinicid: String,
    clinicname: String,
    owner: [], // appuserid
    address: String,
    phone: [],
    website: String,
    clinicidentifiednumber: String, // clinic license or registration no
    clinicidentifiedphoto: String,
}

export interface ClinicInput{
    userid: String,
    clinicname: String,
    owner: [], // appuserid
    address: String,
    phone: [], 
    website: String,
    clinicidentifiednumber: String,// clinic license or registration no
}

@singleton()
export default class ClinicClass {
    Schema = mongoose.Schema;

    clinicschema = new this.Schema({
        clinicid: Number,
        clinicname: String,
        owner: [Object], // appuserid
        address: String,
        phone: [Object],
        website: String,
        clinicidentifiednumber: String, // clinic license or registration no
        clinicidentifiedphoto: String,
        ...BaseModel
    });
    model = mongoose.models.clinic || mongoose.model("clinic", this.clinicschema);
}

