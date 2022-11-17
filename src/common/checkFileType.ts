const allowedFileType = ["image/jpeg", "image/jpg", "image/png"];

const checkFileType = (filetype: string) => {
    
    let allowed = true;

    console.log(filetype);
    if(allowedFileType.includes(filetype)){
        allowed = true;
    }
    return allowed;
};

export default checkFileType;
