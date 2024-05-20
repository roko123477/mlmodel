const mongoose=require('mongoose');

const StoreSchema=new mongoose.Schema({
    user_image:{
        type:String,
        required:true,
    },
    imagefilename:{
        type:String,
        required:true,
    },
    pred_class:{
        type:String,
        required:true
    },
    prediction:[[mongoose.Schema.Types.Mixed]],

},{timestamps:true});

module.exports=mongoose.model('Store',StoreSchema);