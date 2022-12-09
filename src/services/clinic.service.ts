import { Request } from "express";
import mongoose from "mongoose";
import AesEncryption from "../common/aesEncryption";
// import { ISKCUser, RSKCUser } from "../models/skcuser.model";
// import ISKCUserClass from "../models/skcuser.model";
import AppUserClass from "../models/appuser.model";
import { injectable } from "tsyringe";
import environment from "../../environment";
// import getTokenFromHeader from "../common/headerToken";
import generateFilename from "../common/generateFilename";
import minioClient from "../common/minio";
import * as fs from "fs"; //for unlink(delete) old image in folder
import checkFileType from "../common/checkFileType";
import ClinicClass, { Clinic } from "../models/clinic.model";
import { v4 as uuidv4 } from "uuid";

const jwt = require("jsonwebtoken");

const { secretKey, algorithms } = environment.getJWTConfig();

@injectable()
export class ClinicServices {
    clinic: mongoose.Model<any>;
    appusers: mongoose.Model<any>;
    constructor(clinic?: ClinicClass, appuser?: AppUserClass) {
        this.clinic = clinic!.model;
        this.appusers = appuser!.model;
    }

    // setup clinic
    public async setupclinic(
        req: Request
    ): Promise<{ status: string; data: any }> {
        var status: any;
        var data: any;
        var list: any = [];
        try {
            // check request parameter contain or not
            const check = this.checksetupclinicrequest(req);
            if (check == "fail") {
                data = {};
                const status = "insufficient";
                return { status, data };
            }
            const { userid, clinicname, clinicidentifiednumber } = req.body;
            const _userid = AesEncryption.encrypt(userid);
            //check user exit or not
            const filter_userid = {
                $or: [{ username: _userid }, { phone: _userid }],
            };
            var filter = await this.appusers.findOne(filter_userid);
            if (filter != null && filter.appuserid) {

                //   const { clinicname,clinicidentifiednumber }= req.body;
                const _clinicname = AesEncryption.encrypt(clinicname);
                const _clinicidentifiednumber = AesEncryption.encrypt(clinicidentifiednumber);
                const filter_clinic = {
                    $or: [{ clinicname: _clinicname }, { clinicidentifiednumber: _clinicidentifiednumber }],
                };
                const check_exist = await this.clinic.findOne(filter_clinic);
                if (check_exist != null) {
                    data = {};
                    const status = "unauthorized";
                    return { data, status };
                }
                var files: any = req.files;
                console.log(req);
                const clinicidentifiedphoto = files?.find((x: any) => x.fieldname == "clinicidentifiedphoto");

                if (clinicidentifiedphoto == undefined) {
                    console.log('here')
                    data = {};
                    status = "insufficient";
                    return { status, data };
                }
                // Check Image Type
                if (
                    !checkFileType(clinicidentifiedphoto.mimetype)
                ) {
                    data = {};
                    status = "invalidimg";
                    return { status, data };
                }

                const clinicidentifiedphotoname = generateFilename(clinicidentifiedphoto.originalname);
                const await_smphoto = await minioClient.fPutObject(
                    "skcbucket",
                    "clinicidentifiedphoto/" + clinicidentifiedphotoname,
                    clinicidentifiedphoto["path"],
                    { "Content-Type": "application/octet-stream" }
                );


                /* Deleting the file from the uploads folder. */
                fs.unlink(clinicidentifiedphoto["path"], (err) => {
                    if (err) {
                        throw err;
                    }
                })

                const clinicid = uuidv4();
                // collect request parameter for appuser
                const clinic_data: Clinic = {
                    clinicid: clinicid,
                    clinicname: _clinicname,
                    owner: req.body.owner, // appuserid
                    address: AesEncryption.encrypt(req.body.address),
                    phone: req.body.address,
                    website: AesEncryption.encrypt(req.body.website),
                    clinicidentifiednumber: AesEncryption.encrypt(req.body.clinicidentifiednumber), // clinic license or registration no
                    clinicidentifiedphoto: AesEncryption.encrypt(req.body.clinicidentifiedphoto),
                    created_date: new Date(Date.now()),
                    modified_date: new Date(),
                    created_user: _userid,
                    modified_user: "null",
                    is_delete: false,
                    is_active: false,
                };
                const clinic_value = new this.clinic(clinic_data);
                const clinic_result = await clinic_value.save();

                data = clinic_result;
                status = "success";
                return { status, data };
            } else {
                data = {};
                const status = "invalid";
                return { data, status };
            }

        } catch (e) {
            data = e;
            status = "fail";
            return { status, data };
        }
    }

    public checksetupclinicrequest(req: Request) {
        // check request parameter contain or not
        if
            (req.body.clinicname &&
            req.body.userid &&
            req.body.owner &&
            req.body.address &&
            req.body.phone &&
            req.body.clinicidentifiednumber
        ) {
            return "fail";
        }
    }
}
