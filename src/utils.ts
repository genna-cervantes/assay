import { Result } from "./types";

export const tryCatch = async <TData>(p: Promise<TData>): Promise<Result<TData>> => {
    try{
        const value = await p;
        return {
            value,
            error: null
        }
    }catch(err){
        return {
            value: null,
            error: err
        }
    }
}