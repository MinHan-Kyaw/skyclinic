import mongoose from "mongoose";
import { singleton } from "tsyringe";
import { BaseModel } from "./common.model";

export interface ISKCUser extends BaseModel {
  skcuserid: String,
  appuserid: String,
  fullname: String,
  othername: String,
  email: String,
  address: String,
  dob?: Date,
  gender: String,
  bloodtype: String,
  allergicdrug: String,
  cmt: String, //current medical treatment
  usertype: String,
  identifiednumber: String,
  identifiedphoto_front: String,
  identifiedphoto_back: String,
  profileimage: String,
  age: Number
}

// Response Format
export interface RSKCUser {
  username: String,
  phone: String,
  fullname: String,
  othername: String,
  email: String,
  address: String,
  dob: String,
  gender: String,
  bloodtype: String,
  allergicdrug: String,
  cmt: String, //current medical treatment
  usertype: String,
  identifiednumber: String,
  identifiedphoto_front: String,
  identifiedphoto_back: String,
  profileimage: String,
  age: Number
}

export interface IUserUpdate {
  userid: String,
  fullname: String,
  othername: String,
  email: String,
  address: String,
  dob: Date,
  gender: String,
  bloodtype: String,
  allergicdrug: String,
  cmt: String, //current medical treatment
  identifiednumber: String,
}

@singleton()
export default class ISKCUserClass {
  Schema = mongoose.Schema;

  skcschema = new this.Schema({
    skcuserid: String,
    appuserid: String,
    fullname: String,
    othername: String,
    email: String,
    address: String,
    dob: Date,
    gender: String,
    bloodtype: String,
    allergicdrug: String,
    cmt: String, //current medical treatment
    usertype: String,
    identifiednumber: String,
    identifiedphoto_front: String,
    identifiedphoto_back: String,
    profileimage: String,
    age: Number,
    ...BaseModel
  });
  model = mongoose.models.skcusers || mongoose.model("skcusers", this.skcschema);
}
