import app from "./src/config/app";
// import env from "./environment";
// import dotenv from 'dotenv';

// dotenv.config();
const PORT = process.env.PORT;

// const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
})