import dotenv from "dotenv";

enum Enviroments {
  local_environment = "local",
  dev_environment = "dev",
  prod_environment = "prod",
  qa_environment = "qa",
}

const envFound = dotenv.config();

if (envFound.error) {
  // This error will crash the whole process
  throw new Error("Couldn't find .env file");
}

class Environment {
  private environment: String;
  constructor(environment: String) {
    this.environment = Enviroments.prod_environment;
  }

  getPort(): Number {
    console.log(this.environment)
    if (this.environment === Enviroments.dev_environment) {
      return 8081;
    } else if (this.environment === Enviroments.prod_environment) {
      return 8082;
    } else if (this.environment === Enviroments.qa_environment) {
      return 8083;
    } else {
      return 3000;
    }
  }

  getDBName(): String {
    if (this.environment === Enviroments.dev_environment) {
      return "Test_Dev_DB";
    } else if (this.environment === Enviroments.prod_environment) {
      return "Test_Prod_DB";
    } else if (this.environment === Enviroments.qa_environment) {
      return "Test_Qa_DB";
    } else {
      return "SKC_DB";
    }
  }

  getJWTConfig() {
    return {
      secretKey: process.env.JWT_SECRET,
      algorithms: process.env.JWT_ALGO
    };
  }
}

// export default Environment;

export default new Environment(Enviroments.prod_environment);
