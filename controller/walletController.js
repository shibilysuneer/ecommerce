const Order = require('../models/orderModal')
const Wallet = require('../models/walletModal')
const User = require('../models/userModel');

const loadWallet = async(req,res) => {
    try {
        const userId = req.session.userId;
        const wallet = await Wallet.findOne({userId}).exec()
        if(!wallet){
           return res.render('wallet',{wallet:{balance:0,transactions:[]}})
        }
        wallet.transactions.sort((a,b) => b.date - a.date)
        const user = req.session.userId ? await User.findById(req.session.userId) : null;

        res.render('wallet',{wallet,user})
    } catch (error) {
        console.error('wallet fetching error',error);
        // res.status(500).send('Server Error'); 
        res.redirect("/pageNotfound")
    }
}
const walletBalance= async(req,res) => {
    const orderAmount = req.body.amount;
    const userId = req.session.userId;
    try {
        const wallet = await Wallet.findOne({userId})
        if(wallet && wallet.balance >=orderAmount){
            wallet.balance -= orderAmount;
            wallet.transactions.push({
                type: 'debit',
                amount: orderAmount,
                description: `Order payment of ₹${orderAmount}`, // Description of the transaction
                date: new Date()
            });
            await wallet.save();
            res.json({success:true,sufficientBalance: true})
        }else {
            res.json({ success: false, sufficientBalance: false });
        }
    } catch (error) {
        console.error('Error checking wallet balance:', error);
        res.status(500).json({ success: false, error: 'Error checking wallet balance' });
    }
}

module.exports = {
    loadWallet,
    walletBalance
}
