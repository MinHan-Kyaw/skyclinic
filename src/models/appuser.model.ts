import mongoose from 'mongoose';
import { singleton } from 'tsyringe';
import { BaseModel } from './common.model';

export interface AppIUser extends BaseModel{
    appuserid: String,
    username: String, // Username , cannot dupllicate
    phone: String,
    password: String,
    verify?: Boolean,
}

export interface AppReqUser{
    username: String,
    fullname: String,
    phone: String,
    password: String,
    email: String,
}

export interface AppSignInUser{
    userid: String,
    password: String,
}

export interface AppUserOTP{
    userid: String,
    token: String
}

@singleton()
export default class AppUserClass {
    Schema = mongoose.Schema;

    userschema = new this.Schema({
        appuserid: String,
        username: String,
        phone: String,
        password: String,
        verify: Boolean,
        ...BaseModel
    });
  model = mongoose.models.appusers || mongoose.model("appusers", this.userschema);
}

