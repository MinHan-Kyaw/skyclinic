
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
//   import { ISKCUser, IUserUpdate, RSKCUser } from "../models/skcuser.model";
import AppUserClass from "../models/appuser.model";
import IdoctorClass, { IDoctorDetail } from "../models/doctor.model";
import ClinicClass from "../models/clinic.model";
import { injectable } from "tsyringe";

@injectable()
export class UserRoleService {
    doctor: mongoose.Model<any>;
    appusers: mongoose.Model<any>;
    clinic: mongoose.Model<any>;
    constructor(doctor?: IdoctorClass, appuser?: AppUserClass, clinic?: ClinicClass) {
        this.doctor = doctor!.model;
        this.appusers = appuser!.model;
        this.clinic = clinic!.model;
    }
    // Get User Detail
    public async getrole(
        req: IDoctorDetail
    ): Promise<{ status: string; data: any }> {
        var data: any;
        var status: any;
        // var list: any = [];
        try {
            const { userid } = req;
            const _userid = AesEncryption.encrypt(userid);
            // check user exit or not
            const filter_userid = {
                $or: [{ username: _userid }, { phone: _userid }],
            };
            var filter = await this.appusers.findOne(filter_userid);
            console.log(filter);
            if (filter != null && filter.appuserid) {
                const _appuserid = filter.appuserid;

                //   const _appuserid = AesEncryption.encrypt(appuserid);
                const appuser_filter = { appuserid: _appuserid };
                var doctorres = await this.doctor.findOne(appuser_filter);

                var clinicres = await this.clinic.find({ owner: { $regex: _appuserid } });
                console.log("ClinicRES");
                console.log(clinicres);

                //check user is deleted or not
                var isdoctor = false;
                var clinicowner = false;
                if (doctorres && doctorres["is_delete"] == false) {
                    isdoctor = true;
                }
                if (clinicres.length > 0) {
                    clinicowner = true;
                }

                data = { "isdoctor": isdoctor, "clinicowner": clinicowner };
                status = "success";
                return { status, data };
            } else {
                data = {};
                const status = "invalid";
                return { data, status };
            }
        } catch (e: any) {
            data = e;
            status = "fail";
            return { status, data };
        }
    }
}