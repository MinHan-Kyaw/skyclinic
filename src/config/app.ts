import express from "express";
import 'reflect-metadata';
import { container } from "tsyringe";
import helment from "helmet";
import cors from "cors";
import environment from "../../environment";
import mongoose from "mongoose";
import user_route from "../routes/user.route";
import doctor_route from "../routes/doctor.route";
import { ErrorRoutes } from "../routes/error.route";
import passport from "passport";
import middlewarePassport from "../middlewares/passport";

require("dotenv").config();

class App {
  public app: express.Application;
  public mongoURL: string =
    // for local
    "mongodb://localhost:27017/" + environment.getDBName();
    // "mongodb://mongo_db:27017/" + process.env.DB_NAME;
    // "mongodb://mongo_db:27017/" + environment.getDBName();
    // "mongodb://skcprocd:sdTGeX008io0OBWjXbSQpNImVAtmOCxNwPIt1CGSvPdtH4RB1wPHW2z9EnyxnajYpkwDC3gcUp3PdSOHQrvGpQ==@skcprocd.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@skcprocd@";
  private user_controller = container.resolve(user_route);
  private doctor_controller = container.resolve(doctor_route);
  // private routes: Routes = new Routes();
  private error_routes: ErrorRoutes = new ErrorRoutes();

  constructor() {
    this.app = express();
    this.config();
    this.mongoSetUp();
    this.user_controller.route(this.app);
    this.doctor_controller.route(this.app);
    this.error_routes.route(this.app);
    // get config variable
    // dotenv.config();
  }

  private config() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(helment());
    this.app.use(cors());
    this.app.use(passport.initialize());
    passport.use(middlewarePassport);
  }

  private mongoSetUp() {
    // const DATABASE_URL = process.env.DATABASE_URL || "mongodb://skcprocd:sdTGeX008io0OBWjXbSQpNImVAtmOCxNwPIt1CGSvPdtH4RB1wPHW2z9EnyxnajYpkwDC3gcUp3PdSOHQrvGpQ==@skcprocd.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@skcprocd@";
    // const DATABASE_NAME = process.env.DATABASE_NAME || "SKC_DB";
    //create database and connect
    mongoose.connect(this.mongoURL, {
      dbName: 'SKC_DB'
    },(err: any) => {
      if (err) {
        console.log(err.message);
        process.exit(1);
      } else {
        console.log("Connected to the database");
      }

    });
  }
}
export default new App().app;
