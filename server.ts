import app from "./src/config/app";
import environment from "./environment";
// import env from "./environment";
// import dotenv from 'dotenv';

// dotenv.config();
// const PORT = process.env.PORT;

// const PORT = environment.getPort();

const PORT = process.env.PORT;

app.listen(3000, '0.0.0.0', () => {
    console.log(`Server is running on PORT ${PORT}`);
});