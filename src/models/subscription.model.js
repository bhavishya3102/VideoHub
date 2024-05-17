import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    // iss channel ke kitne subscriber he
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing our channel 
        ref: "User"
    },
    // isne kitne channel ko subscribe kiya h
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing 
        ref: "User"
    }
}, {timestamps: true})



export const Subscription = mongoose.model("Subscription", subscriptionSchema)