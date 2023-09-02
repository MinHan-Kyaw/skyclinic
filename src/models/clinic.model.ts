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
    doctor: String[],
    clinicidentifiednumber: String, // clinic license or registration no
    clinicidentifiedphoto: String,
}

export interface ClinicInput{
    userid: String,
    clinicname: String,
    owner: [],
    address: String,
    phone: [], 
    website: String,
    doctor: [],
    clinicidentifiednumber: String,// clinic license or registration no
}

export interface ClinicUpdateInput{
    clinicid: String,
    userid: String,
    clinicname: String,
    owner: [],
    address: String,
    phone: [], 
    doctor: [],
    website: String,
    clinicidentifiednumber: String,// clinic license or registration no
}

export interface IGetClinicModel{
    userid: String
}

export interface ILinkDoctor{
    userid: String,
    doctorid: String,
    clinicid: String
}

export interface ClinicDoctor extends BaseModel{
    doctor: []
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
        doctor: [String],
        clinicidentifiednumber: String, // clinic license or registration no
        clinicidentifiedphoto: String,
        ...BaseModel
    });
    model = mongoose.models.clinic || mongoose.model("clinic", this.clinicschema);
}

