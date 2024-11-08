const {updateUserFace} = require("../models/facialModel");
const {findUserByNric} = require("../models/userModel")

async function registerUserFace(req, res){
    const {nric, Face_Data} = req.body;

    try{
        const user = await findUserByNric(nric);
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        await updateUserFace(nric, Face_Data)
        return res.status(200).json({message: "User face updated successfully"})
    } catch (err){
        console.error("Error during registration:", error)
        return res.status(500).json({message:"Server error during registration"})
    }
}

module.exports = registerUserFace