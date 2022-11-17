import { Request, Response, Application } from "express";

export class ErrorRoutes {
    public route(app: Application) {

        //check all url
        app.all("*", function (req: Request, res: Response) {
            res.status(404).send({status:"FAILURE", message: "Please check your URL." , error: true});
        })
    }
}