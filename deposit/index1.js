import Web3 from 'web3';
import express from 'express';
import bodyParser from 'body-parser';
import Sequelize from 'sequelize';
import winston from 'winston';
import ethereumjs from 'ethereumjs-tx';
import Common from 'ethereumjs-common';

import DailyRotateFile from 'winston-daily-rotate-file';
import CronJob from 'cron';
import nodemailer from 'nodemailer';



let transportApi = new DailyRotateFile({
	filename: 'logs/%DATE%.log',
	datePattern: 'YYYY-MM-DD'
});

const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
	format: combine(
		label({ label: 'DETECTTRANSACTION' }),
		timestamp(),
		myFormat
	),
	transports: [
		transportApi
	],
});


let defaultAccount = "0xc0Ad750e5DF7490722B736e971cE0f2cEC706010";
let defaultAccountPrivateKey = "d5110d99a356a78066c651d0a7ef699105725c53f352c6eaf79875acc8d633fe";


let users = [];


function send(details) {
	try {
		var transport = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 587,
			secure: false, // upgrade later with STARTTLS
			auth: {
				user: "info@bnbbest.io",
				pass: "@123456aA@"
			}
		});
		transport.sendMail(details);
	} catch (error) {
		console.log(error);
		logger.log('error', error);
	}
}
function emailDepositReceive(to, transactionId, amount) {

    var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
        '<html xmlns="http://www.w3.org/1999/xhtml">' +
        '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
        '<title>Bnbbest</title>' +
        '</head>' +
        '<body>'+
        `<h2>Deposit received ${amount} BNB</h2>` +
        '<br>' +
        '<br>' +
        `<a href="https://bscscan.com/tx/${transactionId}">`+
        transactionId
        '</a>' +
        '</body></html>';

    var details =  {
        to: to,
        from: 'info@bnbbest.io',
        subject: 'bnbbest.io - Deposit received',
        html: html

    };
    send(details);
};

const sequelize = new Sequelize( 'bustabitdb', 'postgres',  'postgres', {
	host: 'localhost',
	dialect: 'postgres',
	operatorsAliases: false,

	pool: {
		max: 15,
		min: 5,
		acquire: 30000,
		idle: 10000
	}
});

const User = sequelize.define("users", {
    id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
    },
    username: {
		type: Sequelize.STRING
    },
    sponsor_id: {
		type: Sequelize.INTEGER,
    },
    address: {
		type: Sequelize.STRING
    },
    privateKey: {
		type: Sequelize.STRING
    },
    balance_satoshis: {
		type: Sequelize.DECIMAL
    }
}, {
    timestamps: false
});

const Commission = sequelize.define("commissions", {
    id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
    },
    user_id: {
		type: Sequelize.INTEGER,
    },
    description: {
		type: Sequelize.STRING
    },
    amount: {
		type: Sequelize.DECIMAL
    },
    funding_id: {
		type: Sequelize.INTEGER,
    }
}, {
    timestamps: false
});

const Funding = sequelize.define("fundings", {
    id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
    },
    user_id: {
		type: Sequelize.INTEGER
    },
    bitcoin_deposit_txid: {
		type: Sequelize.STRING,
		primaryKey: true,
    },
    amount: {
		type: Sequelize.DECIMAL
    },
    description: {
		type: Sequelize.STRING
    },
    created: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
}, {
    timestamps: false
});


const options = {
	// Enable auto reconnection
	  timeout: 30000, // ms
  
	  clientConfig: {
		  // Useful if requests are large
		  maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
		  maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
  
		  // Useful to keep a connection alive
		  keepalive: true,
		  keepaliveInterval: -1 // ms
	  },
	reconnect: {
		auto: true,
		delay: 5000, // ms
		maxAttempts: 50,
		onTimeout: false
	}
  };
const newProvider = () => new Web3.providers.WebsocketProvider("wss://bsc-ws-node.nariox.org:443", options); //mainnet
// const newProvider = () => new Web3.providers.WebsocketProvider("wss://data-seed-prebsc-1-s1.binance.org:8545/", options);
let web3 = new Web3(newProvider());
const checkActive = () => {
if (!web3.currentProvider.connected) {
	web3.setProvider(newProvider());
}
}
setInterval(checkActive, 2000);


async function sendAllBnb(fromAddress, toAddress, privateKeyStr) {
	console.log(`${fromAddress} ${toAddress}`);
	if(privateKeyStr.indexOf('0x') == 0){
		privateKeyStr = privateKeyStr.substring(2);
	}
	var privateKey = Buffer.from(privateKeyStr, 'hex');
	let amount = await web3.eth.getBalance(fromAddress)
	let gasPrice = await web3.eth.getGasPrice();
	let nonce = await web3.eth.getTransactionCount(fromAddress);
	var rawTx = {
		from : fromAddress,
		to : toAddress,
		nonce: nonce,
		gasPrice: web3.utils.toHex(gasPrice),
	}
	let totalSent = Math.floor(amount - gasPrice * 21001);
	console.log(`${fromAddress} ${toAddress} ${totalSent} `);
	if(totalSent < 0){
		return;
	}
	let gasLimit = await web3.eth.estimateGas(rawTx);
	rawTx.gasLimit = web3.utils.toHex(gasLimit);
	rawTx.value = web3.utils.toHex(totalSent);
	console.log(`${fromAddress} ${toAddress} ${privateKeyStr} ${totalSent} ${amount} ${rawTx.gasPrice}`);
	//change thành bsc main net lấy theo metamask là: url: https://bsc-dataseed.binance.org/ chainId: 56 networkId: 56
	// var common = Common.default.forCustomChain ('mainnet', {
	// 	networkId: 97, 
	// 	chainId: 97, 
	// 	name: 'Binance testnet',
	// 	url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
	// }, 'istanbul');
	var common = Common.default.forCustomChain ('mainnet', {
		networkId: 56, 
		chainId: 56, 
		name: 'Binance mainnet',
		url: 'wss://bsc-ws-node.nariox.org:443'
	}, 'istanbul');
	var tx = new ethereumjs.Transaction(rawTx, { "common": common });
	tx.sign(privateKey);

	var serializedTx = tx.serialize();
	return new Promise(resolve => {
		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
		.on('transactionHash', function(hash){
			resolve(hash);
		})
		.on('error', function(error){
			console.log(error);
			logger.log('error', error);
			resolve(null);
		});
    })	
}


async function sendBnb(fromAddress, toAddress, amount, privateKeyStr) {
	var privateKey = Buffer.from(privateKeyStr, 'hex');
	let  gasPrice = await web3.eth.getGasPrice();
	let nonce = await web3.eth.getTransactionCount(fromAddress);
	var rawTx = {
		from : fromAddress,
		to : toAddress,
		nonce: nonce,
		gasPrice: web3.utils.toHex(gasPrice),
		value: web3.utils.toHex(Math.floor(amount * 1000000000000000000)),
	}
	console.log(`${fromAddress} ${toAddress} ${privateKeyStr} ${rawTx.value}`);
	let gasLimit = await web3.eth.estimateGas(rawTx);
	rawTx.gasLimit = web3.utils.toHex(gasLimit);
	//change thành bsc main net lấy theo metamask là: url: https://bsc-dataseed.binance.org/ chainId: 56 networkId: 56
	// var common = Common.default.forCustomChain ('mainnet', {
	// 	networkId: 97, 
	// 	chainId: 97, 
	// 	name: 'Binance testnet',
	// 	url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
	// }, 'istanbul');
	var common = Common.default.forCustomChain ('mainnet', {
		networkId: 56, 
		chainId: 56, 
		name: 'Binance mainnet',
		url: 'wss://bsc-ws-node.nariox.org:443'
	}, 'istanbul');
	var tx = new ethereumjs.Transaction(rawTx, { "common": common });
	tx.sign(privateKey);

	var serializedTx = tx.serialize();
	return new Promise(resolve => {
		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
		.on('transactionHash', function(hash){
			resolve(hash);
		})
		.on('error', function(error){
			console.log(error);
			logger.log('error', error);
			resolve(null);
		});
    })	
}

//let hashTmp = await sendBnb(defaultAccount,"0x941CA3Ab6386E671D1462f8A0F4Ff7D715C144b6",0.001, defaultAccountPrivateKey);
//console.log(hashTmp);


let latestKnownBlockNumber = -1;

// Our function that will triggered for every block
async function processBlock(blockNumber) {
    console.log("processBlock : " + blockNumber);
    let block = await web3.eth.getBlock(blockNumber);
	let retStatus = true;
    for (var i=0;i < block.transactions.length;i++) {
		try {
			let transactionHash = block.transactions[i];
			let transaction = await web3.eth.getTransaction(transactionHash);
			//logger.log('info', transactionHash);
			let transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
			transaction = Object.assign(transaction, transactionReceipt);
	
			function filterByAddress(item) {
				return (item.address && transaction.to && item.address.toUpperCase() == transaction.to.toUpperCase());
			}
			var isInArr = users.filter(filterByAddress);
			if(isInArr == undefined || isInArr.length == 0){
				continue;
			}
			let trans = await Funding.findAll({
				where: {
					bitcoin_deposit_txid: transaction.transactionHash,
				}
			});
			if(trans.length == 0){
				let userTmp = isInArr[0];
				let tmpAmount = transaction.value/1000000000000;
				const funding = {
					user_id: userTmp.id,
					bitcoin_deposit_txid: transaction.transactionHash,
					amount: tmpAmount,
					created: new Date(),
					description: 'Bnb Deposit',
				};
				
				let aFund = await Funding.create(funding);
				//cập nhật tiền vào ví user
				userTmp.balance_satoshis = Number(userTmp.balance_satoshis) + Number(tmpAmount);
				await userTmp.save();
				//gửi email thông báo 
				if(userTmp.email != null){
					emailDepositReceive(userTmp.email,transaction.transactionHash,tmpAmount );
				}

				//Tính hoa hồng nạp
				const coms = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625];
				async function calcuCommission(sponsor_id, childname, amount, level) {
					if(level > 6 || !sponsor_id || !amount){
						return
					}
					let sponsor = await User.findByPk(sponsor_id);
					if(!sponsor){
						return
					}
					if(sponsor.balance_satoshis >= 500000){
						let comAmount = amount*coms[level]/100;			
						await Commission.create({
							user_id: sponsor.id,
							amount: comAmount,
							description: `${coms[level]}% commission from F${level+1} when ${childname} deposit`,
							funding_id: aFund.id
						});
						//Cộng vào tài khoản cho user
						sponsor.balance_satoshis = Number(sponsor.balance_satoshis) + Number(comAmount);
						await sponsor.save();
					}

					if(sponsor.sponsor_id){
						calcuCommission(sponsor.sponsor_id, childname, amount, level+1);
					}

				}
				calcuCommission(userTmp.sponsor_id, userTmp.username, tmpAmount, 0)

			}
		} catch (error) {
			retStatus = false;
			console.log("processBlock",error);
			logger.log('error', error);
		}
    }
	if(retStatus){
		latestKnownBlockNumber = blockNumber;
	}
	return retStatus;
}

// This function is called every blockTime, check the current block number and order the processing of the new block(s)
async function checkCurrentBlock() {
    const currentBlockNumber = await web3.eth.getBlockNumber();
    console.log("Current blockchain top: " + currentBlockNumber, " | Script is at: " + latestKnownBlockNumber);
    while (latestKnownBlockNumber == -1 || currentBlockNumber > latestKnownBlockNumber) {
        await processBlock(latestKnownBlockNumber == -1 ? currentBlockNumber : latestKnownBlockNumber + 1);
    }
    setTimeout(checkCurrentBlock, 2000);
}

//checkCurrentBlock();



const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.get('/processBlock', async(req, res) => {
	if(req.query.number == undefined){
		res.json({'status': 'ko', 'message': 'Number is not set'});
		return;
	}
	try {
		let tmpLatestKnownBlockNumber = latestKnownBlockNumber;
		await processBlock(Number(req.query.number));
		latestKnownBlockNumber = tmpLatestKnownBlockNumber;
		res.json({'status': 'ok'});
		return;
	} catch (error) {
		console.log(error);
		logger.log('error', error);
		res.json({'status': 'ko'});
	}
})


app.get('/sendBnb', async(req, res) => {
	if(req.query.to == undefined){
		res.json({'status': 'ko', 'message': 'to is not set'});
		return;
	}
	if(req.query.amount == undefined){
		res.json({'status': 'ko', 'message': 'amount is not set'});
		return;
	}
	try {
		let hash = await sendBnb(defaultAccount,req.query.to,req.query.amount, defaultAccountPrivateKey);
		res.json({'status': 'ok', 'hash': hash});
		return;
	} catch (error) {
		console.log(error);
		logger.log('error', error);
		res.json({'status': 'ko'});
	}
})

app.get('/user/generateAddress', async(req, res) => {
	if(req.query.id == undefined){
		res.json({'status': 'ko', 'message': 'id is not set'});
		return;
	}
	try {
		let aUser = await User.findByPk(req.query.id);
		if(!aUser){
			res.json({'status': 'ko'});
		}
		
		let json = await web3.eth.accounts.create();
		// cập nhật privateKey
		aUser.address = json.address;
		aUser.privateKey = json.privateKey;
		await aUser.save();
		//reload users list
		users = await User.findAll();
		
		res.json({'status': 'ok', 'user': aUser});
	} catch (error) {
		console.log(error);
		logger.log('error', error);
		res.json({'status': 'ko'});
	}
})

app.listen(port, 'localhost', async() => {
	users = await User.findAll();
	console.log(`Example app listening at http://localhost:${port}`)
});




async function jobCollectBnb() {
    console.log("---BEGIN COLLECT BNB---");
	let users = await User.findAll();
	//send TRX to user
	users.forEach(async (user) => {
		try {
			// lấy số lượng bnb trong ví
			if(user.address == null){
				return;
			}
			let amount = await web3.eth.getBalance(user.address)
			// console.log(`${amount} 10000000000000000`);
			if(amount > 100000000000000){
				//nếu bnb > 100000000000000 thi moi collect
				let hash = await sendAllBnb(user.address,defaultAccount,user.privateKey);
			}
		} catch (error) {
			console.log(error);
			logger.log('error', error);
		}
	});
    console.log("---END COLLECT BNB---");
}
const job = new CronJob.CronJob('*/2 * * * *', jobCollectBnb);
job.start();
// jobCollectBnb();

// emailDepositReceive('nguyenminhtan0612@gmail.com','0x1f9994d312ef87394b474d425a0b58af4754c35d1ae2d8072961cbfadbd637d5', 2000 );