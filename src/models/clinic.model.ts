import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import { BaseModel } from './common.model';

export interface Clinic extends BaseModel{
    clinicid: Number,
    clinicname: String,
    owner: [], // appuserid
    address: String,
    phone: [],
    website: String,
    clinicidentifiednumber: String, // clinic license or registration no
    clinicidentifiedphoto: String,
}

@singleton()
export default class ClinicClass {
    Schema = mongoose.Schema;

    clinicschema = new this.Schema({
        clinicid: Number,
        clinicname: String,
        owner: [], // appuserid
        address: String,
        phone: [],
        website: String,
        clinicidentifiednumber: String, // clinic license or registration no
        clinicidentifiedphoto: String,
        ...BaseModel
    });
    model = mongoose.models.clinic || mongoose.model("clinic", this.clinicschema);
}

