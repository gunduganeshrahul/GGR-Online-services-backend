const db=require('../models')
const Auth=db.user;
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')
const crypto=require('crypto');
const transporter=require('../config/mailer');
 


exports.Register=async(req,res)=>
{
    try
    {
        const {UserName,Email,Password,Phone}=req.body;
        if(!UserName||!Email||!Password||!Phone)
        {
            return res.status(400).json({success:false,message:"UserName,Email,Password, this field are required"});
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email))
        {
            return res.status(400).json({success:false,message:"Invalid email fount"});
        }

        if(Password.length<8)
        {
            return res.status(400).json({success:false,message:"Password must be atleast 8 characters"})
        }
         const normalizedEmail = Email.trim().toLowerCase();
         
        const existed=await Auth.findOne({where:{Email:normalizedEmail}});
        if(existed)
        {
            return res.status(409).json({success:false,message:"email already existed"});
        }
        const HashPassword=await bcrypt.hash(Password,10);     

        const User=await Auth.create(
            {
                UserName,
                Email:normalizedEmail,
                Password:HashPassword,
                Phone,
               
            },
        );

        return res.status(201).json({success:true,message:"register sucessfully",data:
            {
                UserName:User.UserName,
                Email:User.Email,
                Phone:User.Phone,
                 
            },
        });
    }
    catch(e)
    {
        return res.status(500).json({success:false,message:e.message});
    }
};



exports.Login=async(req,res)=>
{
    try
    {
        const {identifier,Password}=req.body;
        if(!identifier||!Password)
        {
            return res.status(400).json({success:false,message:"Email or Phone and Password are required"});
        }
        const value=identifier.trim();
        const where=value.includes('@')?{Email:value.toLowerCase()}:{Phone:value};
        const User=await Auth.findOne({where});
        if(!User)
        {
            return res.status(404).json({success:false,message:"Email or Phone Number is not registered"});
        }
        if (!User.isActive) {
         return res.status(403).json({ success: false,message: "Your account is inactive"});
}
        const IsMatch=await bcrypt.compare(Password,User.Password);

        if(!IsMatch)
        {
            return res.status(401).json({success:false,message:"Password invalid"});
        }
            const token=jwt.sign(
                {
                    UserID:User.UserID,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:"24h"
                },
            );
            return res.status(200).json({success:true,message:"login sucessfully",token,data:
                {
                     UserID:User.UserID,
                     UserName:User.UserName,
                     Email:User.Email,
                    Phone:User.Phone,
                     Role:User.Role,
                }
            })
    }
    catch(e)
    {
         return res.status(500).json({success:false,message:e.message});
    }
};

exports.Myprofile=async(req,res)=>
{
    try
    {
        const User=await Auth.findByPk(req.user.UserID,
            {
               attributes: ["UserID", "UserName", "Email", "Phone", "Role"]
            }
        );
        if(!User)
        {
            return res.status(404).json({success:false,message:"Usernot found"});
        }
        return res.status(200).json({success:true,message:"profile fetch sucessfully",data:User});

    }
    catch(e)
    {
        return res.status(500).json({success:false,message:e.message});
    }
};

exports.forgotpassword=async(req,res)=>
{
    try
    {
        const {Email}=req.body;
        if(!Email)
        {
            return res.status(400).json({success:false,message:"Email is required"});
        }
        const User=await Auth.findOne({where:{Email}});

        if(!User)
        {
            return res.status(404).json({success:false,message:"User not found"});
        }
        const resettoken=crypto.randomBytes(32).toString('hex');
        const resettokenexpired=new Date(Date.now()+5*60*1000);

        User.reset_token=resettoken;
        User.reset_token_expiry=resettokenexpired;
        await User.save();

        const resetlink=`${process.env.CLIENT_URL}/reset-password/${resettoken}`;

        console.log("resetlink:",resetlink);

        await transporter.sendMail(
            {
                from:process.env.EMAIL_FROM,
                to:User.Email,
                subject:"GGR oreders",
                html:
                 `
                <p>Hello ${User.UserName},</p>
                <p>You requested a password reset. Click the link below to reset it. This link expires in 5 minutes.</p>
                <p><a href="${resetlink}">${resetlink}</a></p>
                <p>If you did not request this, you can safely ignore this email.</p>`
            }
        );

        return res.status(200).json({success:true,message:"is Email existed.rest link send to Email"});
    }
    catch(e)
    {
        return res.status(500).json({success:false,message:e.message});
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { Password } = req.body;
        const { token } = req.params;

        if (!Password) {
            return res.status(400).json({
                success: false,
                message: "New password is required"
            });
        }

        if (Password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const User = await Auth.findOne({ where: { reset_token: token } });

        if (!User) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        if (!User.reset_token_expiry || new Date() > new Date(User.reset_token_expiry)) {
            return res.status(400).json({
                success: false,
                message: "Reset link has expired. Please request a new one"
            });
        }

        const hashPassword = await bcrypt.hash(Password, 10);

        User.Password = hashPassword;
        User.reset_token = null;
        User.reset_token_expiry = null;
        await User.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (e) {
        console.error("Reset Password Error:", e);
        return res.status(500).json({ success: false, message: e.message });
    }
};





