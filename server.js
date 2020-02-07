var express = require('express');
var app = express();
var fs = require("fs");
const forge    = require('node-forge');
const request = require('request-promise-native');
const md5 = require('md5');
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
app.post('/pay/', function (req, res) {
//    console.log("This is where the action will happen ");
   var rave = new Rave(req.body.PBFPubKey,req.body.seckey);
 rave.initiatePayment({
    "cardno": req.body.cardno,
    "cvv": req.body.cvv,
    "expirymonth": req.body.expirymonth,
    "expiryyear": req.body.expiryyear,
    "currency": req.body.currency,
    "pin": req.body.pin,
    "country": req.body.country,
    "amount": req.body.amount,
    "email": req.body.email,
    "suggested_auth": "PIN",
    "phonenumber": req.body.phonenumber,
    "firstname": req.body.firstname,
    "lastname": req.body.lastname,
    "IP": "783249238738",
    "txRef": "MC-" + Date.now(),
    "redirect_url": "http://tekplugin.com/transactionSuccessful.html",
    "device_fingerprint": req.body.device_fingerprint
  }).then(function(result) {
      console.log(result);

    res.send(result);
  }
 ).catch(error => res.send(error));
}
)

// var server = app.listen(80, function () {
//    var host = server.address().address
//    var port = server.address().port
//    console.log("Listening on port 80");
// //    console.log("Example app listening at, host, port)
// })

// var server=app.listen(process.env.PORT || 4000, function(){
//   console.log('Your node js server is running');
// });

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);







var options = {
	url: "",
	method: "",
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	},
	body: {
		"PBFPubKey": "",
		"alg": "3DES-24",
		client: "",
	},
	json: true
}

class Rave {
	/**
	 * Rave object constructor
	 * @param {*} public_key This is a string that can be found in merchant rave dashboard
	 * @param {*} secret_key This is a string that can be found in merchant rave dashboard
	 */
	constructor(public_key, secret_key){
        this.public_key = public_key;
        this.secret_key = secret_key;
    }

	encryptCardDetails(key,card_details) {
        card_details = JSON.stringify(card_details);
        let cipher   = forge.cipher.createCipher('3DES-ECB', forge.util.createBuffer(key));
        cipher.start({iv:''});
        cipher.update(forge.util.createBuffer(card_details, 'utf-8'));
        cipher.finish();
        let encrypted = cipher.output;
        return ( forge.util.encode64(encrypted.getBytes()) );
	}

	getKey() {
         let sec_key = this.secret_key;
        let keymd5 = md5(sec_key);
        let keymd5last12 = keymd5.substr(-12);

        let seckeyadjusted = sec_key.replace('FLWSECK-', '');
        let seckeyadjustedfirst12 = seckeyadjusted.substr(0, 12);

        return seckeyadjustedfirst12 + keymd5last12;
	}

	initiatePayment(card_details) {
		return new Promise((resolve, reject) => {
            let hashed_key = this.getKey();
			let encrypted_card_details = this.encryptCardDetails(hashed_key,card_details);
			let payment_options = Object.assign({}, options);
			payment_options.url = 'https://api.ravepay.co/flwv3-pug/getpaidx/api/charge';
			payment_options.body.client = encrypted_card_details;
            payment_options.method = 'POST';
            payment_options.body.PBFPubKey = this.public_key; // set public key
            // console.log(encrypted_card_details);

			request(payment_options)
				.then((result) => {
                    resolve(result);
                    // console.log(result);
				}).catch((err) => {
         reject(err);
                    // console.log(err);
				});
			})
	}
}
