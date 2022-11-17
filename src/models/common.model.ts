export interface BaseModel {
    created_date: Date;
    modified_date: Date;
    created_user: String;
    modified_user: String;
    is_delete: Boolean;
    is_acitve: Boolean;
}

export const BaseModel = {
    created_date: Date,
    modified_date: Date,
    created_user: String,
    modified_user: String,
    is_delete: Boolean,
    is_acitve: Boolean
}

